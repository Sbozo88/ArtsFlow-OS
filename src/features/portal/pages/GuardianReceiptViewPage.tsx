import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganisationSettings } from '../../../hooks/useOrganisationSettings';
import { guardianPortalService } from '../../../services/guardianPortalService';
import type { ReceiptData } from '../../../services/receiptService';

export const GuardianReceiptViewPage: React.FC = () => {
  const { receiptId } = useParams<{ receiptId: string }>();
  const { authUser, organisationId } = useAuth();
  const { settings } = useOrganisationSettings();

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !organisationId || !receiptId) return;
    guardianPortalService.getReceipt(organisationId, authUser.uid, receiptId)
      .then(setReceipt)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [authUser, organisationId, receiptId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <p>{error || 'Receipt not found or access is restricted.'}</p>
        </div>
        <div className="mt-4">
          <Link to="/portal/finance" className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Finance</span>
          </Link>
        </div>
      </div>
    );
  }

  const { payment, learner, allocations, receiptNumber } = receipt;
  const orgName = settings?.branding?.organisationDisplayName || settings?.profile?.name || 'ArtsFlow Organisation';
  const logoUrl = settings?.branding?.logoUrl;
  const footerText = settings?.branding?.documentFooterText;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/portal/finance" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Finance</span>
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* Printable Receipt Sheet */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-md space-y-6 print:shadow-none print:border-none print:p-0">
        <div className="flex items-start justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img src={logoUrl} alt={orgName} className="h-10 w-auto object-contain" />
            )}
            <div>
              <h1 className="text-lg font-black text-slate-900">{orgName}</h1>
              <p className="text-xs text-slate-500">Official Payment Receipt</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
              <CheckCircle2 className="w-4 h-4" />
              <span>Payment Received</span>
            </div>
            <div className="text-base font-black font-mono text-slate-900 mt-0.5">{receiptNumber}</div>
            <div className="text-xs text-slate-500">{payment.createdAt.split('T')[0]}</div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Learner</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {learner ? `${learner.firstName} ${learner.lastName}` : 'Learner'}
            </div>
          </div>

          <div className="text-right">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Payment Method</span>
            <div className="font-bold text-slate-900 uppercase mt-0.5">{payment.paymentMethod}</div>
            {payment.reference && (
              <div className="text-slate-500 text-[11px]">Ref: {payment.reference}</div>
            )}
          </div>
        </div>

        {/* Amount Hero */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Amount Received:</span>
          <span className="text-2xl font-black text-slate-900">
            R{(payment.amount / 100).toFixed(2)}
          </span>
        </div>

        {/* Allocations */}
        {allocations.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allocated Towards</div>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {allocations.map((a, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">
                    {a.invoice?.invoiceNumber || 'Invoice'}
                  </span>
                  <span className="font-bold text-slate-900">
                    R{(a.allocation.amount / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {footerText && (
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
            {footerText}
          </div>
        )}
      </div>
    </div>
  );
};
