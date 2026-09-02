import { invoiceRepository } from '../repositories/invoiceRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { chargeRepository } from '../repositories/chargeRepository';
import { chargeTypeRepository } from '../repositories/chargeTypeRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { guardianRepository } from '../repositories/guardianRepository';
import { programmeRepository } from '../repositories/programmeRepository';
import { programmeGroupRepository } from '../repositories/programmeGroupRepository';
import { eventRepository } from '../repositories/eventRepository';
import { addMoney, subtractMoney } from '../lib/money';
import type { ChargeType, Learner, Guardian, Programme, ProgrammeGroup, Event } from '../types';

export interface FinanceDashboardMetrics {
  totalInvoiced: number; // In cents
  totalReceived: number; // In cents
  outstandingBalance: number; // In cents
  overdueBalance: number; // In cents
  paymentsThisMonth: number; // In cents
  unallocatedPayments: number; // In cents
  invoiceCount: number;
  paymentCount: number;
}

export const financeReportingService = {
  /**
   * Computes overview dashboard KPIs based on actual financial records.
   */
  async getDashboardMetrics(
    organisationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<FinanceDashboardMetrics> {
    const [allInvoices, allPayments] = await Promise.all([
      invoiceRepository.getByOrganisation(organisationId),
      paymentRepository.getByOrganisation(organisationId)
    ]);

    const today = new Date().toISOString().split('T')[0];
    const currentYearMonth = today.slice(0, 7); // YYYY-MM

    // Filter invoices by date range if provided
    const invoices = allInvoices.filter(inv => {
      if (inv.invoiceStatus === 'cancelled') return false;
      if (startDate && inv.issueDate < startDate) return false;
      if (endDate && inv.issueDate > endDate) return false;
      return true;
    });

    // Filter payments by date range if provided
    const payments = allPayments.filter(p => {
      if (p.paymentStatus === 'reversed') return false;
      if (startDate && p.paymentDate < startDate) return false;
      if (endDate && p.paymentDate > endDate) return false;
      return true;
    });

    const totalInvoiced = invoices.reduce((sum, inv) => addMoney(sum, inv.total), 0);
    const totalReceived = payments.reduce((sum, p) => addMoney(sum, p.amount), 0);

    const outstandingBalance = invoices.reduce((sum, inv) => addMoney(sum, inv.balance), 0);

    const overdueBalance = invoices
      .filter(inv => inv.dueDate < today && inv.balance > 0 && inv.invoiceStatus !== 'paid')
      .reduce((sum, inv) => addMoney(sum, inv.balance), 0);

    const paymentsThisMonth = allPayments
      .filter(p => p.paymentStatus !== 'reversed' && p.paymentDate.startsWith(currentYearMonth))
      .reduce((sum, p) => addMoney(sum, p.amount), 0);

    const unallocatedPayments = allPayments
      .filter(p => p.paymentStatus !== 'reversed')
      .reduce((sum, p) => {
        const unallocated = Math.max(0, subtractMoney(p.amount, p.allocatedAmount || 0));
        return addMoney(sum, unallocated);
      }, 0);

    return {
      totalInvoiced,
      totalReceived,
      outstandingBalance,
      overdueBalance,
      paymentsThisMonth,
      unallocatedPayments,
      invoiceCount: invoices.length,
      paymentCount: payments.length
    };
  },

  /**
   * Fetches comprehensive data context for generating all operational reports.
   */
  async getReportsContext(organisationId: string) {
    const [
      invoices,
      payments,
      charges,
      chargeTypes,
      learners,
      guardians,
      programmes,
      groups,
      events
    ] = await Promise.all([
      invoiceRepository.getByOrganisation(organisationId),
      paymentRepository.getByOrganisation(organisationId),
      chargeRepository.getByOrganisation(organisationId),
      chargeTypeRepository.getByOrganisation(organisationId),
      learnerRepository.getByOrganisation(organisationId),
      guardianRepository.getByOrganisation(organisationId),
      programmeRepository.getByOrganisation(organisationId),
      programmeGroupRepository.getByOrganisation(organisationId),
      eventRepository.getByOrganisation(organisationId)
    ]);

    const learnerMap = new Map<string, Learner>(learners.map(l => [l.id, l]));
    const guardianMap = new Map<string, Guardian>(guardians.map(g => [g.id, g]));
    const chargeTypeMap = new Map<string, ChargeType>(chargeTypes.map(ct => [ct.id, ct]));
    const programmeMap = new Map<string, Programme>(programmes.map(p => [p.id, p]));
    const groupMap = new Map<string, ProgrammeGroup>(groups.map(gr => [gr.id, gr]));
    const eventMap = new Map<string, Event>(events.map(e => [e.id, e]));

    return {
      invoices,
      payments,
      charges,
      chargeTypes,
      learners,
      guardians,
      programmes,
      groups,
      events,
      learnerMap,
      guardianMap,
      chargeTypeMap,
      programmeMap,
      groupMap,
      eventMap
    };
  }
};
