import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { paymentRepository } from '../repositories/paymentRepository';
import { paymentAllocationRepository } from '../repositories/paymentAllocationRepository';
import { paymentAllocationService } from './paymentAllocationService';
import { invoiceService } from './invoiceService';
import { auditService } from './auditService';
import type { Payment, PaymentMethod, PaymentStatus } from '../types';

export interface RecordPaymentInput {
  learnerId?: string;
  guardianId?: string;
  paymentDate: string;
  amount: number; // In cents
  currency?: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  externalReference?: string;
  receivedBy: string;
  notes?: string;
  allocations?: { invoiceId: string; amount: number }[];
}

export const paymentService = {
  async getPayments(
    organisationId: string,
    filters?: {
      learnerId?: string;
      guardianId?: string;
      paymentStatus?: PaymentStatus;
    }
  ): Promise<Payment[]> {
    const all = await paymentRepository.getByOrganisation(organisationId);
    return all.filter(p => {
      if (filters?.learnerId && p.learnerId !== filters.learnerId) return false;
      if (filters?.guardianId && p.guardianId !== filters.guardianId) return false;
      if (filters?.paymentStatus && p.paymentStatus !== filters.paymentStatus) return false;
      return true;
    });
  },

  async getPaymentById(organisationId: string, id: string): Promise<Payment | null> {
    return paymentRepository.getById(organisationId, id);
  },

  /**
   * Generates a collision-safe payment sequence number using a transaction.
   * Format: PAY-YYYY-XXXXXX
   */
  async generateNextPaymentNumber(organisationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const counterDocRef = doc(db, 'paymentCounters', `${organisationId}_${year}`);

    const nextSeq = await runTransaction(db, async transaction => {
      const snap = await transaction.get(counterDocRef);
      let seq = 1;
      if (snap.exists()) {
        seq = (snap.data().currentSequence || 0) + 1;
      }
      transaction.set(
        counterDocRef,
        {
          organisationId,
          year,
          currentSequence: seq,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      return seq;
    });

    return `PAY-${year}-${String(nextSeq).padStart(6, '0')}`;
  },

  async recordPayment(
    organisationId: string,
    input: RecordPaymentInput,
    actorId: string
  ): Promise<Payment> {
    if (input.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    if (!input.paymentDate) {
      throw new Error('Payment date is required.');
    }
    if (!input.receivedBy?.trim()) {
      throw new Error('Name of staff member who received payment is required.');
    }

    const paymentNumber = await this.generateNextPaymentNumber(organisationId);

    const payment = await paymentRepository.create(organisationId, actorId, {
      paymentNumber,
      learnerId: input.learnerId,
      guardianId: input.guardianId,
      paymentDate: input.paymentDate,
      amount: input.amount,
      allocatedAmount: 0,
      currency: input.currency || 'ZAR',
      paymentMethod: input.paymentMethod,
      reference: input.reference?.trim(),
      externalReference: input.externalReference?.trim(),
      receivedBy: input.receivedBy.trim(),
      paymentStatus: 'unallocated',
      notes: input.notes
    } as never);

    await auditService.log(
      organisationId,
      actorId,
      'RECORD_PAYMENT',
      'payment',
      payment.id,
      undefined,
      payment
    );

    // If initial allocations are provided, process them
    if (input.allocations && input.allocations.length > 0) {
      for (const alloc of input.allocations) {
        if (alloc.amount > 0) {
          await paymentAllocationService.allocatePayment(
            organisationId,
            payment.id,
            alloc.invoiceId,
            alloc.amount,
            actorId
          );
        }
      }
      // Return fresh record
      return (await paymentRepository.getById(organisationId, payment.id)) || payment;
    }

    return payment;
  },

  /**
   * Reverses a payment.
   * Atomic rollback:
   * 1. Rolls back all payment allocations for this payment
   * 2. Recalculates all affected invoice balances
   * 3. Marks payment as reversed
   */
  async reversePayment(
    organisationId: string,
    paymentId: string,
    reason: string,
    actorId: string
  ): Promise<Payment> {
    if (!reason?.trim()) {
      throw new Error('Reversal reason is mandatory.');
    }

    const existing = await paymentRepository.getById(organisationId, paymentId);
    if (!existing) throw new Error('Payment not found.');

    if (existing.paymentStatus === 'reversed') {
      throw new Error('Payment has already been reversed.');
    }

    // 1. Rollback active allocations
    const allAllocations = await paymentAllocationRepository.getByOrganisation(organisationId);
    const paymentAllocations = allAllocations.filter(a => a.paymentId === paymentId);

    const affectedInvoiceIds = new Set<string>();
    for (const alloc of paymentAllocations) {
      affectedInvoiceIds.add(alloc.invoiceId);
      await paymentAllocationRepository.softDelete(organisationId, actorId, alloc.id);
    }

    // 2. Recalculate affected invoices
    for (const invoiceId of affectedInvoiceIds) {
      await invoiceService.recalculateInvoiceBalance(organisationId, invoiceId, actorId);
    }

    // 3. Mark payment as reversed
    const now = new Date().toISOString();
    const updates = {
      allocatedAmount: 0,
      paymentStatus: 'reversed' as const,
      reversedAt: now,
      reversalReason: reason.trim(),
      reversedBy: actorId
    };

    await paymentRepository.update(organisationId, actorId, paymentId, updates as never);

    const updated = { ...existing, ...updates };
    await auditService.log(
      organisationId,
      actorId,
      'REVERSE_PAYMENT',
      'payment',
      paymentId,
      existing,
      updated
    );

    return updated;
  }
};
