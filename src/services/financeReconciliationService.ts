import { invoiceRepository } from '../repositories/invoiceRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { paymentAllocationRepository } from '../repositories/paymentAllocationRepository';
import { addMoney, subtractMoney } from '../lib/money';
import { getTodayString } from '../lib/datetime';
import type { Invoice, Payment, PaymentAllocation, InvoiceStatus, PaymentStatus } from '../types';

export interface InvoiceDiscrepancy {
  invoiceId: string;
  invoiceNumber: string;
  learnerId: string;
  recordedTotal: number;
  recordedAmountPaid: number;
  expectedAmountPaid: number;
  recordedBalance: number;
  expectedBalance: number;
  recordedStatus: InvoiceStatus;
  expectedStatus: InvoiceStatus;
  issues: string[];
}

export interface PaymentDiscrepancy {
  paymentId: string;
  paymentNumber: string;
  totalAmount: number;
  recordedAllocated: number;
  expectedAllocated: number;
  unallocatedAmount: number;
  recordedStatus: PaymentStatus;
  expectedStatus: PaymentStatus;
  issues: string[];
}

export interface OrganisationReconciliationReport {
  organisationId: string;
  generatedAt: string;
  totalInvoicesScanned: number;
  totalPaymentsScanned: number;
  totalAllocationsScanned: number;
  totalInvoicedAmount: number;
  totalCollectedAmount: number;
  totalAllocatedAmount: number;
  totalOutstandingBalance: number;
  isHealthy: boolean;
  invoiceDiscrepancies: InvoiceDiscrepancy[];
  paymentDiscrepancies: PaymentDiscrepancy[];
}

export const financeReconciliationService = {
  /**
   * Validates the mathematical and status integrity of a single invoice against its allocations.
   */
  validateInvoiceIntegrity(
    invoice: Invoice,
    allocations: PaymentAllocation[],
    todayDate?: string
  ): InvoiceDiscrepancy | null {
    const today = todayDate || getTodayString();
    const activeAllocations = allocations.filter(
      a => a.invoiceId === invoice.id && a.status !== 'deleted'
    );

    const expectedPaid = activeAllocations.reduce((sum, a) => addMoney(sum, a.amount), 0);
    const expectedBalance = Math.max(0, subtractMoney(invoice.total, expectedPaid));

    let expectedStatus: InvoiceStatus;
    if (invoice.invoiceStatus === 'cancelled') {
      expectedStatus = 'cancelled';
    } else if (expectedBalance === 0) {
      expectedStatus = 'paid';
    } else if (expectedPaid > 0) {
      expectedStatus = 'partially_paid';
    } else if (invoice.dueDate && invoice.dueDate < today) {
      expectedStatus = 'overdue';
    } else {
      expectedStatus = invoice.issuedAt ? 'issued' : 'draft';
    }

    const issues: string[] = [];

    // Balance check
    if (invoice.balance !== expectedBalance) {
      issues.push(
        `Balance mismatch: recorded ${invoice.balance} cents, expected ${expectedBalance} cents.`
      );
    }

    // Paid check
    if (invoice.amountPaid !== expectedPaid) {
      issues.push(
        `Amount paid mismatch: recorded ${invoice.amountPaid} cents, expected ${expectedPaid} cents.`
      );
    }

    // Paid invoice cannot have positive balance
    if (invoice.invoiceStatus === 'paid' && invoice.balance > 0) {
      issues.push('Invoice marked as "paid" has a positive outstanding balance.');
    }

    // Unpaid invoice cannot be marked as paid
    if (invoice.invoiceStatus === 'paid' && expectedBalance > 0) {
      issues.push('Invoice marked as "paid" has outstanding unpaid allocations.');
    }

    // Negative balance check
    if (invoice.balance < 0) {
      issues.push('Invoice has negative balance.');
    }

    // Status drift check (ignoring draft vs issued if not published)
    if (
      invoice.invoiceStatus !== expectedStatus &&
      !(invoice.invoiceStatus === 'draft' && expectedStatus === 'issued') &&
      !(invoice.invoiceStatus === 'issued' && expectedStatus === 'draft')
    ) {
      issues.push(
        `Status discrepancy: recorded status "${invoice.invoiceStatus}", derived status "${expectedStatus}".`
      );
    }

    if (issues.length === 0) {
      return null;
    }

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      learnerId: invoice.learnerId,
      recordedTotal: invoice.total,
      recordedAmountPaid: invoice.amountPaid,
      expectedAmountPaid: expectedPaid,
      recordedBalance: invoice.balance,
      expectedBalance,
      recordedStatus: invoice.invoiceStatus,
      expectedStatus,
      issues
    };
  },

  /**
   * Validates the allocation integrity of a single payment against allocations.
   */
  validatePaymentIntegrity(
    payment: Payment,
    allocations: PaymentAllocation[]
  ): PaymentDiscrepancy | null {
    const activeAllocations = allocations.filter(
      a => a.paymentId === payment.id && a.status !== 'deleted'
    );

    const expectedAllocated = activeAllocations.reduce((sum, a) => addMoney(sum, a.amount), 0);
    const unallocated = subtractMoney(payment.amount, expectedAllocated);

    let expectedStatus: PaymentStatus;
    if (payment.paymentStatus === 'reversed') {
      expectedStatus = 'reversed';
    } else if (expectedAllocated === 0) {
      expectedStatus = 'unallocated';
    } else if (unallocated === 0) {
      expectedStatus = 'allocated';
    } else if (unallocated > 0) {
      expectedStatus = 'partially_allocated';
    } else {
      expectedStatus = 'allocated'; // over-allocated error flagged below
    }

    const issues: string[] = [];

    // Over-allocation check
    if (unallocated < 0) {
      issues.push(
        `Over-allocated: total allocated (${expectedAllocated} cents) exceeds payment amount (${payment.amount} cents).`
      );
    }

    // Recorded allocatedAmount check
    if (payment.allocatedAmount !== expectedAllocated) {
      issues.push(
        `Allocated amount mismatch: recorded ${payment.allocatedAmount} cents, expected ${expectedAllocated} cents.`
      );
    }

    // Status discrepancy
    if (payment.paymentStatus !== expectedStatus && payment.paymentStatus !== 'reversed') {
      issues.push(
        `Status discrepancy: recorded "${payment.paymentStatus}", expected "${expectedStatus}".`
      );
    }

    if (issues.length === 0) {
      return null;
    }

    return {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      totalAmount: payment.amount,
      recordedAllocated: payment.allocatedAmount ?? 0,
      expectedAllocated,
      unallocatedAmount: unallocated,
      recordedStatus: payment.paymentStatus,
      expectedStatus,
      issues
    };
  },

  /**
   * Scans an organisation's entire finance history and produces an authoritative audit report.
   * Read-only: never mutates historical financial records.
   */
  async reconcileOrganisation(organisationId: string): Promise<OrganisationReconciliationReport> {
    const [invoices, payments, allocations] = await Promise.all([
      invoiceRepository.getByOrganisation(organisationId),
      paymentRepository.getByOrganisation(organisationId),
      paymentAllocationRepository.getByOrganisation(organisationId)
    ]);

    const activeInvoices = invoices.filter(i => i.status !== 'deleted');
    const activePayments = payments.filter(p => p.status !== 'deleted');
    const activeAllocations = allocations.filter(a => a.status !== 'deleted');

    const invoiceDiscrepancies: InvoiceDiscrepancy[] = [];
    const paymentDiscrepancies: PaymentDiscrepancy[] = [];

    const today = getTodayString();

    let totalInvoiced = 0;
    let totalOutstanding = 0;
    for (const inv of activeInvoices) {
      if (inv.invoiceStatus !== 'cancelled') {
        totalInvoiced = addMoney(totalInvoiced, inv.total);
        totalOutstanding = addMoney(totalOutstanding, inv.balance);
      }
      const disc = this.validateInvoiceIntegrity(inv, activeAllocations, today);
      if (disc) {
        invoiceDiscrepancies.push(disc);
      }
    }

    let totalCollected = 0;
    let totalAllocated = 0;
    for (const p of activePayments) {
      if (p.paymentStatus !== 'reversed') {
        totalCollected = addMoney(totalCollected, p.amount);
        totalAllocated = addMoney(totalAllocated, p.allocatedAmount ?? 0);
      }
      const disc = this.validatePaymentIntegrity(p, activeAllocations);
      if (disc) {
        paymentDiscrepancies.push(disc);
      }
    }

    const isHealthy = invoiceDiscrepancies.length === 0 && paymentDiscrepancies.length === 0;

    return {
      organisationId,
      generatedAt: new Date().toISOString(),
      totalInvoicesScanned: activeInvoices.length,
      totalPaymentsScanned: activePayments.length,
      totalAllocationsScanned: activeAllocations.length,
      totalInvoicedAmount: totalInvoiced,
      totalCollectedAmount: totalCollected,
      totalAllocatedAmount: totalAllocated,
      totalOutstandingBalance: totalOutstanding,
      isHealthy,
      invoiceDiscrepancies,
      paymentDiscrepancies
    };
  }
};
