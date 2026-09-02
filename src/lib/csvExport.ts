import type { OperationalReportRow } from '../types';

export function exportToCsv(options: {
  filename: string;
  columns: Array<{ key: string; label: string }>;
  data: OperationalReportRow[];
}) {
  const { filename, columns, data } = options;

  // Header row
  const headerLine = columns.map(c => escapeCsvValue(c.label)).join(',');

  // Data rows
  const rows = data.map(row => {
    return columns.map(c => {
      const val = row[c.key];
      return escapeCsvValue(val === null || val === undefined ? '' : String(val));
    }).join(',');
  });

  // UTF-8 BOM for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + [headerLine, ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
