import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { guardianRepository } from '../repositories/guardianRepository';
import { addMoney } from '../lib/money';
import type { Learner, Guardian } from '../types';

export interface OutstandingRecord {
  learnerId: string;
  learner?: Learner;
  guardianId?: string;
  guardian?: Guardian;
  totalInvoiced: number; // In cents
  totalPaid: number; // In cents
  outstandingBalance: number; // In cents
  oldestDueDate?: string;
  isOverdue: boolean;
  invoiceCount: number;
}

export const useOutstandingBalances = () => {
  const [outstandingRecords, setOutstandingRecords] = useState<OutstandingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const [allInvoices, allLearners, allGuardians] = await Promise.all([
        invoiceRepository.getByOrganisation(organisationId),
        learnerRepository.getByOrganisation(organisationId),
        guardianRepository.getByOrganisation(organisationId)
      ]);

      const learnerMap = new Map(allLearners.map(l => [l.id, l]));
      const guardianMap = new Map(allGuardians.map(g => [g.id, g]));
      const today = new Date().toISOString().split('T')[0];

      // Group active invoices with balance > 0 by learner
      const byLearner = new Map<string, typeof allInvoices>();
      for (const inv of allInvoices) {
        if (inv.invoiceStatus === 'cancelled') continue;
        if (!byLearner.has(inv.learnerId)) {
          byLearner.set(inv.learnerId, []);
        }
        byLearner.get(inv.learnerId)!.push(inv);
      }

      const records: OutstandingRecord[] = [];
      for (const [learnerId, invoices] of byLearner.entries()) {
        const totalInvoiced = invoices.reduce((sum, i) => addMoney(sum, i.total), 0);
        const totalPaid = invoices.reduce((sum, i) => addMoney(sum, i.amountPaid), 0);
        const outstandingBalance = invoices.reduce((sum, i) => addMoney(sum, i.balance), 0);

        if (outstandingBalance <= 0) continue; // Only learners with outstanding balance

        // Find oldest unpaid invoice due date
        const unpaidInvoices = invoices.filter(i => i.balance > 0);
        unpaidInvoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        const oldestDueDate = unpaidInvoices[0]?.dueDate;
        const isOverdue = unpaidInvoices.some(i => i.dueDate < today);

        const learner = learnerMap.get(learnerId);
        const guardianId = learner ? unpaidInvoices[0]?.guardianId : undefined;
        const guardian = guardianId ? guardianMap.get(guardianId) : undefined;

        records.push({
          learnerId,
          learner,
          guardianId,
          guardian,
          totalInvoiced,
          totalPaid,
          outstandingBalance,
          oldestDueDate,
          isOverdue,
          invoiceCount: unpaidInvoices.length
        });
      }

      // Sort by largest outstanding balance descending
      records.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

      setOutstandingRecords(records);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const [allInvoices, allLearners, allGuardians] = await Promise.all([
          invoiceRepository.getByOrganisation(organisationId),
          learnerRepository.getByOrganisation(organisationId),
          guardianRepository.getByOrganisation(organisationId)
        ]);

        const learnerMap = new Map(allLearners.map(l => [l.id, l]));
        const guardianMap = new Map(allGuardians.map(g => [g.id, g]));
        const today = new Date().toISOString().split('T')[0];

        const byLearner = new Map<string, typeof allInvoices>();
        for (const inv of allInvoices) {
          if (inv.invoiceStatus === 'cancelled') continue;
          if (!byLearner.has(inv.learnerId)) {
            byLearner.set(inv.learnerId, []);
          }
          byLearner.get(inv.learnerId)!.push(inv);
        }

        const records: OutstandingRecord[] = [];
        for (const [learnerId, invoices] of byLearner.entries()) {
          const totalInvoiced = invoices.reduce((sum, i) => addMoney(sum, i.total), 0);
          const totalPaid = invoices.reduce((sum, i) => addMoney(sum, i.amountPaid), 0);
          const outstandingBalance = invoices.reduce((sum, i) => addMoney(sum, i.balance), 0);

          if (outstandingBalance <= 0) continue;

          const unpaidInvoices = invoices.filter(i => i.balance > 0);
          unpaidInvoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          const oldestDueDate = unpaidInvoices[0]?.dueDate;
          const isOverdue = unpaidInvoices.some(i => i.dueDate < today);

          const learner = learnerMap.get(learnerId);
          const guardianId = learner ? unpaidInvoices[0]?.guardianId : undefined;
          const guardian = guardianId ? guardianMap.get(guardianId) : undefined;

          records.push({
            learnerId,
            learner,
            guardianId,
            guardian,
            totalInvoiced,
            totalPaid,
            outstandingBalance,
            oldestDueDate,
            isOverdue,
            invoiceCount: unpaidInvoices.length
          });
        }

        records.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

        if (mounted) {
          setOutstandingRecords(records);
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
  }, [organisationId]);

  return { outstandingRecords, loading, error, refresh: loadData };
};
