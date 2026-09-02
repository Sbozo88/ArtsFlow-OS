import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { financeReportingService, FinanceDashboardMetrics } from '../services/financeReportingService';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import type { Invoice, Payment } from '../types';

export type FinancePeriod = 'this_month' | 'last_month' | 'this_term' | 'this_year' | 'custom';

export const useFinanceDashboard = (
  period: FinancePeriod = 'this_month',
  customStartDate?: string,
  customEndDate?: string
) => {
  const [metrics, setMetrics] = useState<FinanceDashboardMetrics | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  // Compute start and end dates based on period
  const getDateRange = useCallback(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth(); // 0-indexed

    if (period === 'this_month') {
      const start = new Date(y, m, 1).toISOString().split('T')[0];
      const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
      return { start, end };
    }
    if (period === 'last_month') {
      const start = new Date(y, m - 1, 1).toISOString().split('T')[0];
      const end = new Date(y, m, 0).toISOString().split('T')[0];
      return { start, end };
    }
    if (period === 'this_year') {
      const start = `${y}-01-01`;
      const end = `${y}-12-31`;
      return { start, end };
    }
    if (period === 'this_term') {
      // Approximate 3-month block (term quarter)
      const termMonth = Math.floor(m / 3) * 3;
      const start = new Date(y, termMonth, 1).toISOString().split('T')[0];
      const end = new Date(y, termMonth + 3, 0).toISOString().split('T')[0];
      return { start, end };
    }
    return { start: customStartDate, end: customEndDate };
  }, [period, customStartDate, customEndDate]);

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const { start, end } = getDateRange();
      const [kpis, allInvoices, allPayments] = await Promise.all([
        financeReportingService.getDashboardMetrics(organisationId, start, end),
        invoiceRepository.getByOrganisation(organisationId),
        paymentRepository.getByOrganisation(organisationId)
      ]);

      const today = new Date().toISOString().split('T')[0];

      // Recent payments sorted by date descending
      const sortedPayments = allPayments
        .filter(p => p.paymentStatus !== 'reversed')
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
        .slice(0, 5);

      // Recent invoices sorted by issueDate descending
      const sortedInvoices = allInvoices
        .filter(i => i.invoiceStatus !== 'cancelled')
        .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
        .slice(0, 5);

      // Overdue invoices with outstanding balance
      const overdue = allInvoices
        .filter(i => i.invoiceStatus !== 'cancelled' && i.invoiceStatus !== 'paid' && i.dueDate < today && i.balance > 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5);

      setMetrics(kpis);
      setRecentPayments(sortedPayments);
      setRecentInvoices(sortedInvoices);
      setOverdueInvoices(overdue);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, getDateRange]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const { start, end } = getDateRange();
        const [kpis, allInvoices, allPayments] = await Promise.all([
          financeReportingService.getDashboardMetrics(organisationId, start, end),
          invoiceRepository.getByOrganisation(organisationId),
          paymentRepository.getByOrganisation(organisationId)
        ]);

        const today = new Date().toISOString().split('T')[0];

        const sortedPayments = allPayments
          .filter(p => p.paymentStatus !== 'reversed')
          .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
          .slice(0, 5);

        const sortedInvoices = allInvoices
          .filter(i => i.invoiceStatus !== 'cancelled')
          .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
          .slice(0, 5);

        const overdue = allInvoices
          .filter(i => i.invoiceStatus !== 'cancelled' && i.invoiceStatus !== 'paid' && i.dueDate < today && i.balance > 0)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .slice(0, 5);

        if (mounted) {
          setMetrics(kpis);
          setRecentPayments(sortedPayments);
          setRecentInvoices(sortedInvoices);
          setOverdueInvoices(overdue);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, [organisationId, getDateRange]);

  return {
    metrics,
    recentPayments,
    recentInvoices,
    overdueInvoices,
    loading,
    error,
    refresh: loadData
  };
};
