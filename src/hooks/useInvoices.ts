import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Invoice, InvoiceStatus } from '../types';
import { invoiceService } from '../services/invoiceService';

export const useInvoices = (filters?: {
  learnerId?: string;
  invoiceStatus?: InvoiceStatus;
  overdueOnly?: boolean;
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await invoiceService.getInvoices(organisationId, filters);
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, filters?.learnerId, filters?.invoiceStatus, filters?.overdueOnly]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await invoiceService.getInvoices(organisationId, filters);
        if (mounted) {
          setInvoices(data);
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
  }, [organisationId, filters?.learnerId, filters?.invoiceStatus, filters?.overdueOnly]);

  return { invoices, loading, error, refresh: loadData };
};
