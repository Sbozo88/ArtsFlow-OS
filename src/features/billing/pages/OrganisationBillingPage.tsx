import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Clock,
  AlertTriangle,
  Info,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { subscriptionResolverService } from '../../../services/billing/subscriptionResolverService';
import { subscriptionPlanRepository } from '../../../repositories/subscriptionPlanRepository';
import { organisationRepository } from '../../../repositories/organisationRepository';
import { billingCustomerRepository } from '../../../repositories/billingCustomerRepository';
import { UsageMetersCard } from '../components/UsageMetersCard';
import { LoadingState } from '../../../components/ui/LoadingState';
import type {
  Subscription,
  SubscriptionPlan,
  Organisation,
  BillingCustomer
} from '../../../types';

export const OrganisationBillingPage: React.FC = () => {
  const { organisationId } = useAuth();
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
      <div className="py-16 text-center">
        <LoadingState message="Loading subscription & billing details…" size="lg" />
      </div>
    );
  }

  const isTrial = subscription?.subscriptionStatus === 'trialing';
  const isRestricted = organisation?.tenantStatus === 'restricted';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ArtsFlow Platform Subscription</h1>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Manage your organisation’s commercial plan, usage capacity, and platform billing settings.
        </p>
      </div>

      {/* Trial Countdown Banner */}
      {isTrial && (
        <div className="p-5 bg-gradient-to-r from-amber-50 via-amber-100/40 to-white border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-bold text-amber-950 flex items-center gap-2">
                <span>ArtsFlow Commercial Trial</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-200 text-amber-900 font-semibold border border-amber-300/60">
                  {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Your trial includes full access to plan features. Review your plan details before{' '}
                {subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'expiry'}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Restricted Access Banner */}
      {isRestricted && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 text-rose-900 shadow-xs">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            <div className="font-bold text-rose-950 text-base">Your ArtsFlow access is temporarily restricted</div>
            <p className="text-xs text-rose-700 mt-0.5">
              Your subscription requires attention. Operational modifications are paused while administrator access remains available.
            </p>
          </div>
        </div>
      )}

      {/* Notice Separating SaaS Billing from School Finance */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-start gap-3 text-xs text-indigo-900 leading-relaxed shadow-xs">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-indigo-950">Commercial Separation Notice: </span>
          This page manages what your arts organisation pays ArtsFlow for platform software usage. It is completely separate and distinct from learner tuition fees, invoice drafting, and guardian payments in the School Finance module.
        </div>
      </div>

      {/* Current Plan Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Current Plan</span>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-3">
              <span>{plan?.name || 'Legacy Full Access'}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {subscription?.subscriptionStatus || 'Active'}
              </span>
            </div>
            {plan?.description && <p className="text-slate-500 text-sm mt-1">{plan.description}</p>}
          </div>

          <div className="md:text-right">
            <div className="text-2xl font-bold text-slate-900">
              {subscription?.priceAmount
                ? `${subscription.currency} ${(subscription.priceAmount / 100).toFixed(2)}`
                : 'Complimentary / Included'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Billing Interval: <span className="text-slate-700 font-semibold capitalize">{subscription?.billingInterval || 'Monthly'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Billing Mode</div>
            <div className="text-sm font-semibold text-slate-800 mt-1 capitalize">
              {subscription?.billingMode || 'Platform Managed'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Invoice or provider settlement</div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Current Period End</div>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              {subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : 'Indefinite'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Renewal cycle date</div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Billing Contact</div>
            <div className="text-sm font-semibold text-slate-800 mt-1 truncate">
              {billingCustomer?.billingEmail || organisation?.primaryAdminEmail || 'Not specified'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Primary invoice recipient</div>
          </div>
        </div>
      </div>

      {/* Real-time Usage & Plan Limits Meter Card */}
      <UsageMetersCard />

      {/* Plan Features Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Included Feature Capabilities</span>
        </h3>
        <p className="text-xs text-slate-500">
          Features enabled under your active {plan?.name || 'subscription'} tier. Custom overrides may expand these entitlements.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {[
            'Core Student & Class Management',
            'Full Attendance & Session Tracking',
            'Staff Roster & Time Verification',
            'Music & Dance Creative Modules',
            'Events & Rehearsal Scheduling',
            'Workflow Automation Engine'
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
