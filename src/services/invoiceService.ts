import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { invoiceLineItemRepository } from '../repositories/invoiceLineItemRepository';
import { chargeRepository } from '../repositories/chargeRepository';
import { paymentAllocationRepository } from '../repositories/paymentAllocationRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { auditService } from './auditService';
import { organisationSettingsService } from './organisationSettingsService';
import { entitlementResolverService } from './entitlementResolverService';
import { addMoney, subtractMoney } from '../lib/money';
import type { Invoice, InvoiceLineItem, InvoiceStatus } from '../types';

export interface CreateInvoiceInput {
  learnerId: string;
  guardianId?: string;
  chargeIds: string[];
  issueDate?: string;
  dueDate: string;
  notes?: string;
  autoIssue?: boolean;
}

export const invoiceService = {
  async getInvoices(
    organisationId: string,
    filters?: {
      learnerId?: string;
      invoiceStatus?: InvoiceStatus;
      overdueOnly?: boolean;
    }
  ): Promise<Invoice[]> {
    const all = await invoiceRepository.getByOrganisation(organisationId);
    const today = new Date().toISOString().split('T')[0];

    return all.filter(inv => {
      if (filters?.learnerId && inv.learnerId !== filters.learnerId) return false;
      if (filters?.invoiceStatus && inv.invoiceStatus !== filters.invoiceStatus) return false;
      if (filters?.overdueOnly) {
        if (inv.invoiceStatus === 'paid' || inv.invoiceStatus === 'cancelled') return false;
        return inv.dueDate < today && inv.balance > 0;
      }
      return true;
    });
  },

  async getInvoiceById(organisationId: string, id: string): Promise<Invoice | null> {
    return invoiceRepository.getById(organisationId, id);
  },

  async getInvoiceLineItems(organisationId: string, invoiceId: string): Promise<InvoiceLineItem[]> {
    const all = await invoiceLineItemRepository.getByOrganisation(organisationId);
    return all.filter(item => item.invoiceId === invoiceId);
  },

  /**
   * Generates a collision-safe, concurrency-safe invoice number using a transaction.
   * Format: INV-YYYY-XXXXXX (e.g. INV-2026-000001)
   */
  async generateNextInvoiceNumber(organisationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const counterDocRef = doc(db, 'invoiceCounters', `${organisationId}_${year}`);

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

    let prefix = 'INV-';
    let padding = 6;
    try {
      const settings = await organisationSettingsService.getSettings(organisationId);
      if (settings?.finance?.invoicePrefix) prefix = settings.finance.invoicePrefix;
      if (settings?.finance?.invoiceSequencePadding) padding = settings.finance.invoiceSequencePadding;
    } catch {
      // Fall back to defaults
    }

    const cleanPrefix = prefix.endsWith('-') ? prefix : `${prefix}-`;
    return `${cleanPrefix}${year}-${String(nextSeq).padStart(padding, '0')}`;
  },

  /**
   * Creates an invoice from a selection of uninvoiced charges.
   */
  async createInvoiceFromCharges(
    organisationId: string,
    input: CreateInvoiceInput,
    actorId: string
  ): Promise<{ invoice: Invoice; lineItems: InvoiceLineItem[] }> {
    const isEntitled = await entitlementResolverService.hasFeature(organisationId, 'finance.core');
    if (!isEntitled) {
      throw new Error(`Organisation is not entitled to feature 'finance.core'.`);
    }

    if (!input.chargeIds || input.chargeIds.length === 0) {
      throw new Error('At least one charge must be selected to create an invoice.');
    }
    if (!input.dueDate) {
      throw new Error('Due date is required for invoice.');
    }

    const learner = await learnerRepository.getById(organisationId, input.learnerId);
    if (!learner) {
      throw new Error('Learner not found.');
    }

    // Load and validate charges
    const allCharges = await chargeRepository.getByOrganisation(organisationId);
    const selectedCharges = allCharges.filter(c => input.chargeIds.includes(c.id));

    if (selectedCharges.length !== input.chargeIds.length) {
      throw new Error('One or more selected charges could not be found.');
    }

    for (const charge of selectedCharges) {
      if (charge.learnerId !== input.learnerId) {
        throw new Error('All charges on an invoice must belong to the same learner.');
      }
      if (charge.chargeStatus === 'invoiced') {
        throw new Error(`Charge "${charge.description}" is already invoiced.`);
      }
      if (charge.chargeStatus === 'cancelled') {
        throw new Error(`Charge "${charge.description}" is cancelled.`);
      }
      if (charge.chargeStatus === 'waived') {
        throw new Error(`Charge "${charge.description}" is fully waived.`);
      }
    }

    // Concurrency-safe invoice number
    const invoiceNumber = await this.generateNextInvoiceNumber(organisationId);
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const issueDate = input.issueDate || today;

    // Financial calculations in cents
    let subtotal = 0;
    let waiverTotal = 0;
    let discountTotal = 0;

    selectedCharges.forEach(c => {
      subtotal = addMoney(subtotal, c.amount);
      waiverTotal = addMoney(waiverTotal, c.waivedAmount || 0);
      discountTotal = addMoney(discountTotal, c.discountAmount || 0);
    });

    const total = Math.max(0, subtractMoney(subtotal, addMoney(discountTotal, waiverTotal)));
    const balance = total;
    const initialStatus: InvoiceStatus = input.autoIssue ? 'issued' : 'draft';

    const invoice = await invoiceRepository.create(organisationId, actorId, {
      invoiceNumber,
      learnerId: input.learnerId,
      guardianId: input.guardianId || selectedCharges[0]?.guardianId,
      issueDate,
      dueDate: input.dueDate,
      currency: selectedCharges[0]?.currency || 'ZAR',
      subtotal,
      discountTotal,
      waiverTotal,
      total,
      amountPaid: 0,
      balance,
      invoiceStatus: initialStatus,
      notes: input.notes,
      issuedAt: input.autoIssue ? now : undefined
    } as never);

    // Create line items
    const lineItems: InvoiceLineItem[] = [];
    for (const charge of selectedCharges) {
      const netChargeAmount = Math.max(
        0,
        subtractMoney(charge.amount, addMoney(charge.waivedAmount || 0, charge.discountAmount || 0))
      );

      const lineItem = await invoiceLineItemRepository.create(organisationId, actorId, {
        invoiceId: invoice.id,
        chargeId: charge.id,
        description: charge.description,
        quantity: charge.quantity,
        unitAmount: charge.unitAmount,
        lineTotal: netChargeAmount
      } as never);

      lineItems.push(lineItem);

      // Mark charge as invoiced
      await chargeRepository.update(organisationId, actorId, charge.id, {
        chargeStatus: 'invoiced'
      } as never);
    }

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_INVOICE',
      'invoice',
      invoice.id,
      undefined,
      invoice
    );

    return { invoice, lineItems };
  },

  async issueInvoice(organisationId: string, invoiceId: string, actorId: string): Promise<Invoice> {
    const existing = await invoiceRepository.getById(organisationId, invoiceId);
    if (!existing) throw new Error('Invoice not found.');

    if (existing.invoiceStatus !== 'draft') {
      throw new Error(`Cannot issue an invoice with status "${existing.invoiceStatus}".`);
    }

    const now = new Date().toISOString();
    const updates = {
      invoiceStatus: 'issued' as const,
      issuedAt: now
    };

    await invoiceRepository.update(organisationId, actorId, invoiceId, updates as never);

    const updated = { ...existing, ...updates };
    await auditService.log(
      organisationId,
      actorId,
      'ISSUE_INVOICE',
      'invoice',
      invoiceId,
      existing,
      updated
    );

    return updated;
  },

  async cancelInvoice(
    organisationId: string,
    invoiceId: string,
    reason: string,
    actorId: string
  ): Promise<void> {
    if (!reason?.trim()) {
      throw new Error('Cancellation reason is required.');
    }

    const existing = await invoiceRepository.getById(organisationId, invoiceId);
    if (!existing) throw new Error('Invoice not found.');

    if (existing.invoiceStatus === 'cancelled') {
      throw new Error('Invoice is already cancelled.');
    }

    // Check if payments are allocated
    const allocations = await paymentAllocationRepository.getByOrganisation(organisationId);
    const invoiceAllocations = allocations.filter(a => a.invoiceId === invoiceId);

    if (invoiceAllocations.length > 0) {
      throw new Error(
        'Cannot cancel invoice with active payment allocations. Reallocate or reverse allocations first.'
      );
    }

    const now = new Date().toISOString();
    const updates = {
      invoiceStatus: 'cancelled' as const,
      cancelledAt: now,
      cancellationReason: reason.trim()
    };

    await invoiceRepository.update(organisationId, actorId, invoiceId, updates as never);

    // Unlink charges back to active
    const lineItems = await this.getInvoiceLineItems(organisationId, invoiceId);
    for (const item of lineItems) {
      if (item.chargeId) {
        await chargeRepository.update(organisationId, actorId, item.chargeId, {
          chargeStatus: 'active'
        } as never);
      }
    }

    await auditService.log(
      organisationId,
      actorId,
      'CANCEL_INVOICE',
      'invoice',
      invoiceId,
      existing,
      { ...existing, ...updates }
    );
  },

  /**
   * Authoritative balance and status recalculation for an invoice.
   * Derived purely from: total - SUM(paymentAllocations)
   */
  async recalculateInvoiceBalance(
    organisationId: string,
    invoiceId: string,
    actorId: string
  ): Promise<Invoice> {
    const existing = await invoiceRepository.getById(organisationId, invoiceId);
    if (!existing) throw new Error('Invoice not found.');

    if (existing.invoiceStatus === 'cancelled') {
      return existing; // cancelled invoices remain cancelled
    }

    const allocations = await paymentAllocationRepository.getByOrganisation(organisationId);
    const invoiceAllocations = allocations.filter(a => a.invoiceId === invoiceId);

    const amountPaid = invoiceAllocations.reduce((sum, a) => addMoney(sum, a.amount), 0);
    const balance = Math.max(0, subtractMoney(existing.total, amountPaid));

    const today = new Date().toISOString().split('T')[0];
    let newStatus: InvoiceStatus;

    if (balance === 0) {
      newStatus = 'paid';
    } else if (amountPaid > 0) {
      newStatus = 'partially_paid';
    } else if (existing.dueDate < today) {
      newStatus = 'overdue';
    } else {
      newStatus = existing.issuedAt ? 'issued' : 'draft';
    }

    const updates = {
      amountPaid,
      balance,
      invoiceStatus: newStatus
    };

    await invoiceRepository.update(organisationId, actorId, invoiceId, updates as never);

    const updated = { ...existing, ...updates };
    return updated;
  }
};
