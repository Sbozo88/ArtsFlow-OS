import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Printer, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganisationSettings } from '../../../hooks/useOrganisationSettings';
import { guardianPortalService } from '../../../services/guardianPortalService';
import type { GuardianInvoiceDto } from '../../../types';

export const GuardianInvoiceViewPage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { authUser, organisationId } = useAuth();
  const { settings } = useOrganisationSettings();

  const [invoice, setInvoice] = useState<GuardianInvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !organisationId || !invoiceId) return;
    guardianPortalService.getInvoice(organisationId, authUser.uid, invoiceId)
      .then(setInvoice)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [authUser, organisationId, invoiceId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <p>{error || 'Invoice not found or access is restricted.'}</p>
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

  const orgName = settings?.branding?.organisationDisplayName || settings?.profile?.name || 'ArtsFlow Organisation';
  const logoUrl = settings?.branding?.logoUrl;
  const headerText = settings?.branding?.documentHeaderText;
  const footerText = settings?.branding?.documentFooterText;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img src={logoUrl} alt={orgName} className="h-12 w-auto object-contain" />
            )}
            <div>
              <h1 className="text-xl font-black text-slate-900">{orgName}</h1>
              {headerText && <p className="text-xs text-slate-500 mt-0.5">{headerText}</p>}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Tax Invoice</div>
            <div className="text-xl font-black font-mono text-slate-900 mt-0.5">{invoice.invoiceNumber}</div>
            <div className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              invoice.invoiceStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {invoice.invoiceStatus}
            </div>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Billed To</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{invoice.learnerName}</div>
          </div>
          <div className="text-right">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Issue Date: </span>
              <span className="font-semibold text-slate-800">{invoice.issueDate}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Due Date: </span>
              <span className="font-semibold text-slate-800">{invoice.dueDate}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-center w-20">Qty</th>
                <th className="px-4 py-3 text-right w-28">Amount</th>
                <th className="px-4 py-3 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 font-medium">{item.description}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">R{(item.unitAmountCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold">R{(item.lineTotalCents / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>R{(invoice.subtotalCents / 100).toFixed(2)}</span>
            </div>
            {invoice.discountCents > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount / Waiver:</span>
                <span>-R{(invoice.discountCents / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>Total:</span>
              <span>R{(invoice.totalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Amount Paid:</span>
              <span>R{(invoice.amountPaidCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-rose-600 pt-1 border-t border-slate-100">
              <span>Balance Due:</span>
              <span>R{(invoice.balanceCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {footerText && (
          <div className="pt-8 border-t border-slate-200 text-center text-[11px] text-slate-400">
            {footerText}
          </div>
        )}
      </div>
    </div>
  );
};
