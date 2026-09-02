import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface MetricKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBg?: string;
  linkTo?: string;
  linkText?: string;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  highlight?: 'normal' | 'attention' | 'urgent' | 'critical';
}

export function MetricKpiCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-indigo-50 text-indigo-600',
  linkTo,
  linkText,
  trend,
  highlight = 'normal'
}: MetricKpiCardProps) {
  const borderHighlight = {
    normal: 'border-slate-200',
    attention: 'border-amber-300 bg-amber-50/20',
    urgent: 'border-orange-300 bg-orange-50/20',
    critical: 'border-rose-300 bg-rose-50/20'
  }[highlight];

  return (
    <div className={`p-5 bg-white rounded-xl border ${borderHighlight} shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          <div className={`p-2 rounded-lg ${iconBg}`}>
            {icon}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
          {trend && (
            <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-slate-500'}`}>
              {trend.text}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>

      {linkTo && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600 hover:text-indigo-700">
          <Link to={linkTo} className="inline-flex items-center gap-1">
            <span>{linkText || 'View details'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
