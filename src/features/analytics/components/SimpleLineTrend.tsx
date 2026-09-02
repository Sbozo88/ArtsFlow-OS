interface TrendPoint {
  label: string;
  value: number;
}

interface SimpleLineTrendProps {
  data: TrendPoint[];
  title?: string;
  valueSuffix?: string;
  height?: number;
  emptyMessage?: string;
}

export function SimpleLineTrend({
  data,
  title,
  valueSuffix = '%',
  height = 140,
  emptyMessage = 'Insufficient trend data'
}: SimpleLineTrendProps) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        {title && <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>}
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-lg">
          {emptyMessage}
        </div>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(100, ...values);
  const range = maxVal - minVal || 100;

  const width = 500;
  const paddingX = 30;
  const paddingY = 20;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW;
    const y = height - paddingY - ((d.value - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  // Fill area under line
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <span className="text-xs font-medium text-indigo-600">
            Latest: {data[data.length - 1].value}{valueSuffix}
          </span>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Baseline grid */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path d={areaD} fill="rgba(99, 102, 241, 0.08)" />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

          {/* Point circles & values */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
              <text
                x={pt.x}
                y={height - 5}
                fontSize="9"
                textAnchor="middle"
                fill="#94a3b8"
                fontFamily="sans-serif"
              >
                {pt.label.length > 5 ? pt.label.slice(-5) : pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
