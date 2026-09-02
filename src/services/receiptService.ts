import { paymentRepository } from '../repositories/paymentRepository';
import { paymentAllocationRepository } from '../repositories/paymentAllocationRepository';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { guardianRepository } from '../repositories/guardianRepository';
import type { Payment, PaymentAllocation, Invoice, Learner, Guardian } from '../types';

export interface ReceiptData {
  receiptNumber: string;
  payment: Payment;
  learner?: Learner;
  guardian?: Guardian;
  allocations: {
    allocation: PaymentAllocation;
    invoice?: Invoice;
  }[];
}

export const receiptService = {
  /**
   * Derives receipt data purely from immutable payment, allocation, and invoice records.
   */
  async getReceiptForPayment(
    organisationId: string,
    paymentId: string
  ): Promise<ReceiptData | null> {
    const payment = await paymentRepository.getById(organisationId, paymentId);
    if (!payment) return null;

    // Load learner & guardian if present
    let learner: Learner | undefined;
    let guardian: Guardian | undefined;

    if (payment.learnerId) {
      learner = (await learnerRepository.getById(organisationId, payment.learnerId)) || undefined;
    }
    if (payment.guardianId) {
      guardian = (await guardianRepository.getById(organisationId, payment.guardianId)) || undefined;
    }

    // Load allocations
    const allAllocations = await paymentAllocationRepository.getByOrganisation(organisationId);
    const paymentAllocations = allAllocations.filter(a => a.paymentId === paymentId);

    // Load allocated invoices
    const allocationsWithInvoices = await Promise.all(
      paymentAllocations.map(async alloc => {
        const invoice = (await invoiceRepository.getById(organisationId, alloc.invoiceId)) || undefined;
        return {
          allocation: alloc,
          invoice
        };
      })
    );

    // Derive receipt number consistently
    const receiptNumber = payment.paymentNumber
      ? payment.paymentNumber.replace('PAY-', 'REC-')
      : `REC-${payment.id.slice(0, 8).toUpperCase()}`;

    return {
      receiptNumber,
      payment,
      learner,
      guardian,
      allocations: allocationsWithInvoices
    };
  }
};
