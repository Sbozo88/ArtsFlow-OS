import { paymentAllocationRepository } from '../repositories/paymentAllocationRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { invoiceService } from './invoiceService';
import { auditService } from './auditService';
import { addMoney, subtractMoney } from '../lib/money';
import type { PaymentAllocation, PaymentStatus } from '../types';

export const paymentAllocationService = {
  async getAllocations(
    organisationId: string,
    filters?: { paymentId?: string; invoiceId?: string }
  ): Promise<PaymentAllocation[]> {
    const all = await paymentAllocationRepository.getByOrganisation(organisationId);
    return all.filter(a => {
      if (filters?.paymentId && a.paymentId !== filters.paymentId) return false;
      if (filters?.invoiceId && a.invoiceId !== filters.invoiceId) return false;
      return true;
    });
  },

  /**
   * Allocates an amount from a payment to an outstanding invoice.
   * Validates both remaining payment balance and invoice outstanding balance.
   */
  async allocatePayment(
    organisationId: string,
    paymentId: string,
    invoiceId: string,
    amountToAllocate: number, // In cents
    actorId: string
  ): Promise<PaymentAllocation> {
    if (amountToAllocate <= 0) {
      throw new Error('Allocation amount must be greater than zero.');
    }

    const payment = await paymentRepository.getById(organisationId, paymentId);
    if (!payment) throw new Error('Payment not found.');

    if (payment.paymentStatus === 'reversed') {
      throw new Error('Cannot allocate from a reversed payment.');
    }

    const invoice = await invoiceRepository.getById(organisationId, invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    if (invoice.invoiceStatus === 'cancelled') {
      throw new Error('Cannot allocate payment to a cancelled invoice.');
    }
    if (invoice.balance <= 0) {
      throw new Error('Invoice has zero outstanding balance.');
    }
    if (amountToAllocate > invoice.balance) {
      throw new Error(
        `Allocation amount (${amountToAllocate / 100}) cannot exceed invoice balance (${invoice.balance / 100}).`
      );
    }

    // Check payment unallocated balance
    const existingAllocations = await paymentAllocationRepository.getByOrganisation(organisationId);
    const paymentAllocations = existingAllocations.filter(a => a.paymentId === paymentId);
    const currentlyAllocated = paymentAllocations.reduce((sum, a) => addMoney(sum, a.amount), 0);
    const unallocatedPayment = subtractMoney(payment.amount, currentlyAllocated);

    if (amountToAllocate > unallocatedPayment) {
      throw new Error(
        `Allocation amount exceeds remaining unallocated payment balance (${unallocatedPayment / 100}).`
      );
    }

    // Create allocation
    const now = new Date().toISOString();
    const allocation = await paymentAllocationRepository.create(organisationId, actorId, {
      paymentId,
      invoiceId,
      amount: amountToAllocate,
      allocationDate: now
    } as never);

    // Update payment status
    const newAllocatedTotal = addMoney(currentlyAllocated, amountToAllocate);
    let newPaymentStatus: PaymentStatus = 'partially_allocated';
    if (newAllocatedTotal >= payment.amount) {
      newPaymentStatus = 'allocated';
    }

    await paymentRepository.update(organisationId, actorId, paymentId, {
      allocatedAmount: newAllocatedTotal,
      paymentStatus: newPaymentStatus
    } as never);

    // Recalculate invoice balance and status
    await invoiceService.recalculateInvoiceBalance(organisationId, invoiceId, actorId);

    await auditService.log(
      organisationId,
      actorId,
      'ALLOCATE_PAYMENT',
      'paymentAllocation',
      allocation.id,
      undefined,
      allocation
    );

    return allocation;
  },

  /**
   * Removes/reverses a payment allocation and recalculates invoice and payment balances.
   */
  async removeAllocation(
    organisationId: string,
    allocationId: string,
    actorId: string
  ): Promise<void> {
    const existing = await paymentAllocationRepository.getById(organisationId, allocationId);
    if (!existing) throw new Error('Allocation not found.');

    const payment = await paymentRepository.getById(organisationId, existing.paymentId);
    const invoiceId = existing.invoiceId;

    // Delete allocation record (or softDelete)
    await paymentAllocationRepository.softDelete(organisationId, actorId, allocationId);

    // Recalculate payment status
    if (payment) {
      const remainingAllocations = (await paymentAllocationRepository.getByOrganisation(organisationId))
        .filter(a => a.paymentId === payment.id && a.id !== allocationId);
      const newTotal = remainingAllocations.reduce((sum, a) => addMoney(sum, a.amount), 0);
      let status: PaymentStatus = 'unallocated';
      if (newTotal > 0 && newTotal < payment.amount) {
        status = 'partially_allocated';
      } else if (newTotal >= payment.amount) {
        status = 'allocated';
      }

      await paymentRepository.update(organisationId, actorId, payment.id, {
        allocatedAmount: newTotal,
        paymentStatus: status
      } as never);
    }

    // Recalculate invoice
    await invoiceService.recalculateInvoiceBalance(organisationId, invoiceId, actorId);

    await auditService.log(
      organisationId,
      actorId,
      'REMOVE_PAYMENT_ALLOCATION',
      'paymentAllocation',
      allocationId,
      existing,
      { status: 'deleted' }
    );
  }
};
