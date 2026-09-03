import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { subscriptionResolverService } from '../../../services/billing/subscriptionResolverService';
import { subscriptionPlanRepository } from '../../../repositories/subscriptionPlanRepository';
import { organisationRepository } from '../../../repositories/organisationRepository';
import { billingCustomerRepository } from '../../../repositories/billingCustomerRepository';
import type {
  Subscription,
  SubscriptionPlan,
  Organisation,
  BillingCustomer
} from '../../../types';

export const OrganisationBillingPage: React.FC = () => {
  const { organisationId, authUser } = useAuth();
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCustomer, setBillingCustomer] = useState<BillingCustomer | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBillingData = async () => {
      if (!organisationId) return;
      try {
        setLoading(true);
        const [org, sub, customer] = await Promise.all([
          organisationRepository.getById(organisationId),
          subscriptionResolverService.getCurrentSubscription(organisationId),
          billingCustomerRepository.getByOrganisation(organisationId)
        ]);

        setOrganisation(org);
        setSubscription(sub);
        setBillingCustomer(customer);

        if (sub?.subscriptionStatus === 'trialing' && sub.trialEndsAt) {
          const remaining = Math.max(
            0,
            Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );
          setTrialDaysRemaining(remaining);
        } else {
          setTrialDaysRemaining(0);
        }

        const planId = sub?.planId || org?.assignedPlanId || 'plan_legacy_full';
        const planData = await subscriptionPlanRepository.getById(planId);
        setPlan(planData);
      } catch (err) {
        console.error('Failed to load organisation billing data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, [organisationId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <CreditCard className="w-8 h-8 animate-pulse text-indigo-400 mx-auto mb-3" />
        Loading subscription & billing details...
      </div>
    );
  }

  const isTrial = subscription?.subscriptionStatus === 'trialing';
  const isRestricted = organisation?.tenantStatus === 'restricted';

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">ArtsFlow Platform Subscription</h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Manage your organisation’s commercial tier, subscription lifecycle, and billing settings.
        </p>
      </div>

      {/* Trial Countdown Banner */}
      {isTrial && (
        <div className="p-5 bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span>ArtsFlow Commercial Trial</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400/20 text-amber-300 font-semibold">
                  {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Your trial includes full access to plan features. Review your plan details before{' '}
                {subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'expiry'}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Restricted Access Banner */}
      {isRestricted && (
        <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-4 text-rose-300">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-base">Your ArtsFlow access is temporarily restricted</div>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Your subscription requires attention. Operational modifications are paused while administrator access remains available.
            </p>
          </div>
        </div>
      )}

      {/* Notice Separating SaaS Billing from School Finance */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Commercial Separation Notice: </span>
          This page manages what your arts organisation pays ArtsFlow for platform usage. It is completely independent from learner tuition fees, invoice drafting, and parent receipts in the School Finance module.
        </div>
      </div>

      {/* Current Plan Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Current Plan</span>
            <div className="text-2xl font-black text-white mt-1 flex items-center gap-3">
              <span>{plan?.name || 'Legacy Full Access'}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {subscription?.subscriptionStatus || 'Active'}
              </span>
            </div>
            {plan?.description && <p className="text-slate-400 text-sm mt-1">{plan.description}</p>}
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {subscription?.priceAmount
                ? `${subscription.currency} ${(subscription.priceAmount / 100).toFixed(2)}`
                : 'Complimentary / Included'}
            </div>
            <div className="text-xs text-slate-500">
              Billing Interval: <span className="text-slate-300 capitalize">{subscription?.billingInterval || 'Monthly'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Billing Mode</div>
            <div className="text-sm font-semibold text-white mt-1 capitalize">
              {subscription?.billingMode || 'Platform Managed'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Invoice or provider settlement</div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Current Period End</div>
            <div className="text-sm font-semibold text-white mt-1">
              {subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : 'Indefinite'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Renewal cycle date</div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Billing Contact</div>
            <div className="text-sm font-semibold text-white mt-1 truncate">
              {billingCustomer?.billingEmail || organisation?.email || authUser?.email || 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              {billingCustomer?.billingName || organisation?.name || 'Administrator'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
