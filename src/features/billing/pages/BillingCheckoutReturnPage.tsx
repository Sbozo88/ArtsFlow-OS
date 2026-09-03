import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const BillingCheckoutReturnPage: React.FC = () => {
  const location = useLocation();
  const isSuccess = location.pathname.includes('/success');

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 text-center space-y-6 shadow-2xl">
        {isSuccess ? (
          <div className="space-y-3">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Payment Received by Provider</h1>
            <p className="text-sm text-slate-400">
              Your payment was accepted by the billing provider. In accordance with ArtsFlow commercial security protocols, we are verifying the trusted webhook event before updating your subscription tier.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Verified server-side activation in progress.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Checkout Cancelled</h1>
            <p className="text-sm text-slate-400">
              The checkout session was cancelled or not completed. Your existing subscription and organisation access remain unchanged.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800">
          <Link
            to="/settings/billing"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
          >
            <span>Return to Billing Overview</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
