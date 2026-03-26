/**
 * Export utilities: copy TSV to clipboard and download CSV.
 */

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

function formatForExport(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString();
  }
  // Escape quotes in strings
  if (value.includes('"') || value.includes(',') || value.includes('\t') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert table data to TSV string (for clipboard paste into Excel).
 */
export function toTsv(data: TableData): string {
  const headerLine = data.headers.join('\t');
  const dataLines = data.rows.map(row =>
    row.map(cell => formatForExport(cell)).join('\t')
  );
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Convert table data to CSV string.
 */
export function toCsv(data: TableData): string {
  const headerLine = data.headers.map(h => formatForExport(h)).join(',');
  const dataLines = data.rows.map(row =>
    row.map(cell => formatForExport(cell)).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Copy TSV string to clipboard.
 */
export async function copyTsvToClipboard(data: TableData): Promise<boolean> {
  const tsv = toTsv(data);
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = tsv;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

/**
 * Download CSV file.
 */
export function downloadCsv(data: TableData, filename: string): void {
  const csv = toCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
