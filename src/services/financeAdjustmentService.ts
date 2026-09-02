import { financeAdjustmentRepository } from '../repositories/financeAdjustmentRepository';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { chargeService } from './chargeService';
import { invoiceService } from './invoiceService';
import { auditService } from './auditService';
import { addMoney } from '../lib/money';
import type { FinanceAdjustment } from '../types';

export const financeAdjustmentService = {
  async getAdjustments(
    organisationId: string,
    filters?: { invoiceId?: string; chargeId?: string; learnerId?: string }
  ): Promise<FinanceAdjustment[]> {
    const all = await financeAdjustmentRepository.getByOrganisation(organisationId);
    return all.filter(a => {
      if (filters?.invoiceId && a.invoiceId !== filters.invoiceId) return false;
      if (filters?.chargeId && a.chargeId !== filters.chargeId) return false;
      if (filters?.learnerId && a.learnerId !== filters.learnerId) return false;
      return true;
    });
  },

  async createDiscount(
    organisationId: string,
    invoiceId: string,
    amountInCents: number,
    reason: string,
    approvedBy: string,
    actorId: string
  ): Promise<FinanceAdjustment> {
    if (amountInCents <= 0) {
      throw new Error('Discount amount must be greater than zero.');
    }
    if (!reason?.trim()) {
      throw new Error('Discount reason is required.');
    }
    if (!approvedBy?.trim()) {
      throw new Error('Approver name is required.');
    }

    const invoice = await invoiceRepository.getById(organisationId, invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    if (invoice.invoiceStatus === 'cancelled' || invoice.invoiceStatus === 'paid') {
      throw new Error(`Cannot add discount to ${invoice.invoiceStatus} invoice.`);
    }

    const adjustment = await financeAdjustmentRepository.create(organisationId, actorId, {
      invoiceId,
      learnerId: invoice.learnerId,
      adjustmentType: 'discount',
      amount: amountInCents,
      reason: reason.trim(),
      approvedBy: approvedBy.trim()
    } as never);

    // Update invoice discountTotal
    const newDiscountTotal = addMoney(invoice.discountTotal, amountInCents);
    const newTotal = Math.max(0, invoice.subtotal - newDiscountTotal - invoice.waiverTotal);

    await invoiceRepository.update(organisationId, actorId, invoiceId, {
      discountTotal: newDiscountTotal,
      total: newTotal
    } as never);

    await invoiceService.recalculateInvoiceBalance(organisationId, invoiceId, actorId);

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_DISCOUNT',
      'financeAdjustment',
      adjustment.id,
      undefined,
      adjustment
    );

    return adjustment;
  },

  async createWaiver(
    organisationId: string,
    chargeId: string,
    amountInCents: number,
    reason: string,
    approvedBy: string,
    actorId: string
  ): Promise<FinanceAdjustment> {
    await chargeService.waiveCharge(organisationId, chargeId, amountInCents, reason, approvedBy, actorId);

    const adjustment = await financeAdjustmentRepository.create(organisationId, actorId, {
      chargeId,
      adjustmentType: 'waiver',
      amount: amountInCents,
      reason: reason.trim(),
      approvedBy: approvedBy.trim()
    } as never);

    return adjustment;
  }
};
