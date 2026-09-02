import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  ArrowLeft, 
  ArrowUpRight, 
  ShieldAlert, 
  Clock, 
  FileText 
} from 'lucide-react';
import { useDateRangeFilter } from '../../hooks/useDateRangeFilter';
import { useFinanceAnalytics } from '../../hooks/useFinanceAnalytics';
import { DateRangeSelector } from './components/DateRangeSelector';
import { MetricKpiCard } from './components/MetricKpiCard';
import { formatMoney } from '../../lib/money';

export function FinanceAnalyticsPage() {
  const { filter, setPreset, setCustomRange } = useDateRangeFilter();
  const { data, loading } = useFinanceAnalytics(filter.startDate, filter.endDate);

  if (data?.isRestricted) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/analytics" className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to Analytics
          </Link>
        </div>
        <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center max-w-lg mx-auto mt-12">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-amber-900">Restricted Financial Intelligence</h2>
          <p className="text-xs text-amber-700 mt-2">
            In accordance with organisation security policy, overall financial collections, aged debtors, and billing performance metrics are accessible only to Finance Directors and Organisation Administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/analytics" className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Analytics
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            <span>Finance & Aged Receivables Intelligence</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Issued billing volume, verified payment receipts, aged debtor buckets, and programme collection performance.
          </p>
        </div>

        <DateRangeSelector
          filter={filter}
          onPresetChange={setPreset}
          onCustomChange={setCustomRange}
        />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricKpiCard
          title="Total Invoiced"
          value={loading ? '...' : formatMoney(data?.totalInvoiced ?? 0)}
          subtitle="Issued billing volume"
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />

        <MetricKpiCard
          title="Payments Received"
          value={loading ? '...' : formatMoney(data?.totalReceived ?? 0)}
          subtitle="Verified payment transactions"
          icon={<CreditCard className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <MetricKpiCard
          title="Outstanding Balance"
          value={loading ? '...' : formatMoney(data?.outstandingBalance ?? 0)}
          subtitle="Total accounts receivable"
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
          highlight={data && data.outstandingBalance > 500000 ? 'urgent' : 'normal'}
        />

        <MetricKpiCard
          title="Collection Rate"
          value={loading ? '...' : `${data?.collectionRate ?? 0}%`}
          subtitle="Collected vs Invoiced"
          icon={<CreditCard className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Aged Debtors Bucket Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Aged Debtors Analysis (From Due Date)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current (Not Due)</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {formatMoney(data?.ageingSummary.current ?? 0)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Due in future dates</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">1–30 Days</div>
            <div className="text-base font-bold text-amber-800 mt-1">
              {formatMoney(data?.ageingSummary.days1_30 ?? 0)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Mildly overdue</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">31–60 Days</div>
            <div className="text-base font-bold text-orange-800 mt-1">
              {formatMoney(data?.ageingSummary.days31_60 ?? 0)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Second notice</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">61–90 Days</div>
            <div className="text-base font-bold text-rose-800 mt-1">
              {formatMoney(data?.ageingSummary.days61_90 ?? 0)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Urgent reminder</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
            <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">90+ Days</div>
            <div className="text-base font-bold text-rose-900 mt-1">
              {formatMoney(data?.ageingSummary.days90Plus ?? 0)}
            </div>
            <div className="text-[10px] text-rose-600 mt-0.5">Critical default risk</div>
          </div>
        </div>
      </div>

      {/* Programme Collections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Programme Collections Breakdown</h3>
            <p className="text-xs text-slate-500">Revenue invoiced vs collected per operational stream</p>
          </div>
          <Link
            to="/finance/outstanding"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>Outstanding Invoices</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading collection summaries...</div>
        ) : (data?.programmeCollections.length ?? 0) === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No programme billing recorded in this timeframe.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Programme</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Invoiced</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Collected</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Outstanding</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Collection Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.programmeCollections.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.programmeName}</td>
                    <td className="px-4 py-3">{formatMoney(p.invoiced)}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{formatMoney(p.received)}</td>
                    <td className="px-4 py-3 font-medium text-amber-600">{formatMoney(p.outstanding)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.collectionRate >= 80 ? 'bg-emerald-500' : p.collectionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${p.collectionRate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800">{p.collectionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
