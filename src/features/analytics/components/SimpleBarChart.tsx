interface BarDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  subLabel?: string;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarDataPoint[];
  title?: string;
  valueSuffix?: string;
  maxCustom?: number;
  emptyMessage?: string;
}

export function SimpleBarChart({
  data,
  title,
  valueSuffix = '%',
  maxCustom,
  emptyMessage = 'No data available for this period'
}: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        {emptyMessage}
      </div>
    );
  }

  const maxValue = maxCustom || Math.max(...data.map(d => d.value), 100);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
      {title && <h3 className="text-sm font-semibold text-slate-800 mb-4">{title}</h3>}

      <div className="space-y-3">
        {data.map((item, idx) => {
          const percentage = Math.min(100, Math.round((item.value / maxValue) * 100));
          const barColor = item.color || (item.value >= 75 ? 'bg-emerald-500' : item.value >= 60 ? 'bg-amber-500' : 'bg-rose-500');

          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 truncate max-w-[60%]">{item.label}</span>
                <span className="font-semibold text-slate-900">
                  {item.value}{valueSuffix}
                  {item.subLabel && <span className="text-slate-400 font-normal ml-1">({item.subLabel})</span>}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
