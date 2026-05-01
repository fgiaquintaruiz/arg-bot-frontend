/**
 * csvExport.ts
 *
 * Pure utility functions for exporting trade history to CSV.
 * RFC 4180 compliant. UTF-8 BOM included in downloadCsv for Excel compatibility.
 */

// ─── Column schema ────────────────────────────────────────────────────────────

/**
 * Ordered list of CSV columns — single source of truth for header + field extraction.
 */
export const CSV_COLUMNS = [
  'date',
  'eur',
  'usdcReceived',
  'arsAmount',
  'eurArsRate',
  'eurUsdcRate',
  'binanceFeeEur',
  'ripioFeeArs',
  'serviceFee',
  'usdcDestAddress',
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type TradeRecord = {
  date?: string;
  eur?: string | number;
  usdcReceived?: string | number;
  arsAmount?: string | number;
  eurArsRate?: string | number;
  eurUsdcRate?: string | number;
  binanceFeeEur?: string | number;
  ripioFeeArs?: string | number;
  serviceFee?: string | number;
  usdcDestAddress?: string;
  [key: string]: unknown;
};

// ─── escapeField ─────────────────────────────────────────────────────────────

/**
 * Escapes a single CSV field value per RFC 4180.
 *
 * - null / undefined  → empty string
 * - no special chars  → String(value) as-is
 * - contains , " \n \r → wrap in double-quotes; double any internal quotes
 */
export function escapeField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ─── tradeHistoryToCsv ───────────────────────────────────────────────────────

/**
 * Converts an array of trade records to an RFC 4180 CSV string.
 *
 * - Returns only the header line for an empty array.
 * - Sorts records chronologically ascending (oldest first) without mutating input.
 * - Uses escapeField for every cell value.
 * - Rows are joined with \n. No trailing newline.
 */
export function tradeHistoryToCsv(history: TradeRecord[]): string {
  const header = CSV_COLUMNS.join(',');
  if (history.length === 0) {
    return header;
  }
  const sorted = [...history].sort((a, b) => {
    const da = a.date ?? '';
    const db = b.date ?? '';
    if (da < db) return -1;
    if (da > db) return 1;
    return 0;
  });
  const rows = sorted.map((record) =>
    CSV_COLUMNS.map((col) => escapeField(record[col])).join(',')
  );
  return [header, ...rows].join('\n');
}

// ─── downloadCsv ─────────────────────────────────────────────────────────────

/**
 * Triggers a browser download of the given CSV content.
 *
 * Prepends a UTF-8 BOM (\uFEFF) so that Excel auto-detects UTF-8 encoding.
 * Cleans up the object URL after triggering the click. Never throws.
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  try {
    URL.revokeObjectURL(url);
  } catch {
    // silent — some environments may throw on revoke
  }
}
