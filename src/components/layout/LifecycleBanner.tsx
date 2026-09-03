import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { useCustomerLifecycle } from '../../hooks/useCustomerLifecycle';
import { useUsageMetering } from '../../hooks/useUsageMetering';

export function LifecycleBanner() {
  const { lifecycle } = useCustomerLifecycle();
  const { summary } = useUsageMetering();
  const [dismissedMeters, setDismissedMeters] = useState(false);

  if (!lifecycle) return null;

  const banners = [...lifecycle.activeBanners];

  // If there's an exceeded or critical usage meter and no critical banner yet
  if (!dismissedMeters && summary && (summary.anyExceeded || summary.anyCritical)) {
    const exceededKeys = Object.values(summary.meters).filter((m) => m.exceeded);
    const criticalKeys = Object.values(summary.meters).filter((m) => m.status === 'critical');

    if (exceededKeys.length > 0) {
      banners.push({
        id: 'usage_exceeded',
        type: 'danger',
        title: 'Plan Usage Limit Reached',
        message: `${exceededKeys.map((m) => m.name).join(', ')} reached full plan capacity. Upgrade plan to unlock further expansion.`,
        ctaLabel: 'Upgrade Plan',
        ctaAction: 'upgrade',
        ctaPath: '/settings/billing'
      });
    } else if (criticalKeys.length > 0) {
      banners.push({
        id: 'usage_critical',
        type: 'warning',
        title: 'Approaching Plan Capacity',
        message: `${criticalKeys.map((m) => `${m.name} (${m.percentUsed}%)`).join(', ')} is near the plan limit.`,
        ctaLabel: 'Review Limits',
        ctaAction: 'upgrade',
        ctaPath: '/settings/billing'
      });
    }
  }

  if (banners.length === 0) return null;

  // Prioritize danger over warning over info
  const primaryBanner =
    banners.find((b) => b.type === 'danger') ||
    banners.find((b) => b.type === 'warning') ||
    banners[0];

  const isDanger = primaryBanner.type === 'danger';
  const isWarning = primaryBanner.type === 'warning';

  const bgColor = isDanger
    ? 'bg-rose-600 text-white border-b border-rose-700'
    : isWarning
      ? 'bg-amber-500 text-slate-950 border-b border-amber-600 font-medium'
      : 'bg-indigo-600 text-white border-b border-indigo-700';

  const buttonClass = isDanger
    ? 'bg-white text-rose-700 hover:bg-rose-50'
    : isWarning
      ? 'bg-slate-900 text-white hover:bg-slate-800'
      : 'bg-white text-indigo-700 hover:bg-indigo-50';

  const Icon = isDanger ? ShieldAlert : isWarning ? AlertTriangle : Clock;

  return (
    <aside
      aria-label="Lifecycle Announcement"
      className={`relative z-20 px-4 py-2.5 sm:px-6 transition-all shadow-sm ${bgColor}`}
    >
      <div className="mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-7xl">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="text-xs sm:text-sm">
            <strong className="font-semibold mr-2">{primaryBanner.title}</strong>
            <span className="opacity-95">{primaryBanner.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          {primaryBanner.ctaPath ? (
            <Link
              to={primaryBanner.ctaPath}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold shadow-sm transition-colors ${buttonClass}`}
            >
              <span>{primaryBanner.ctaLabel || 'View Details'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <a
              href="mailto:support@artsflow.io"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold shadow-sm transition-colors ${buttonClass}`}
            >
              <span>{primaryBanner.ctaLabel || 'Contact Support'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}

          {primaryBanner.id.startsWith('usage_') && (
            <button
              type="button"
              onClick={() => setDismissedMeters(true)}
              className="p-1 rounded-md hover:bg-black/10 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
