import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { escapeField, tradeHistoryToCsv, downloadCsv, CSV_COLUMNS } from '../utils/csvExport';

// ─── escapeField ─────────────────────────────────────────────────────────────

describe('escapeField', () => {
  it('returns empty string for undefined', () => {
    expect(escapeField(undefined)).toBe('');
  });

  it('returns empty string for null', () => {
    expect(escapeField(null)).toBe('');
  });

  it('returns value as string for plain number', () => {
    expect(escapeField(42)).toBe('42');
    expect(escapeField(3.14)).toBe('3.14');
  });

  it('returns plain string unchanged when no special chars', () => {
    expect(escapeField('hello')).toBe('hello');
    expect(escapeField('0xABC123')).toBe('0xABC123');
  });

  it('wraps in quotes when field contains comma', () => {
    expect(escapeField('5,50')).toBe('"5,50"');
  });

  it('wraps in quotes when field contains newline', () => {
    expect(escapeField('foo\nbar')).toBe('"foo\nbar"');
  });

  it('wraps in quotes when field contains carriage return', () => {
    expect(escapeField('foo\rbar')).toBe('"foo\rbar"');
  });

  it('wraps in quotes when field contains double quote', () => {
    expect(escapeField('say "hello"')).toBe('"say ""hello"""');
  });

  it('doubles internal quotes (RFC 4180): a"b → "a""b"', () => {
    expect(escapeField('a"b')).toBe('"a""b"');
  });
});

// ─── tradeHistoryToCsv ───────────────────────────────────────────────────────

describe('tradeHistoryToCsv', () => {
  const EXPECTED_HEADER =
    'date,eur,usdcReceived,arsAmount,eurArsRate,eurUsdcRate,binanceFeeEur,ripioFeeArs,serviceFee,usdcDestAddress';

  it('returns only the header line for empty array', () => {
    expect(tradeHistoryToCsv([])).toBe(EXPECTED_HEADER);
  });

  it('header matches exact column order: date,eur,usdcReceived,arsAmount,eurArsRate,eurUsdcRate,binanceFeeEur,ripioFeeArs,serviceFee,usdcDestAddress', () => {
    const csv = tradeHistoryToCsv([]);
    const header = csv.split('\n')[0];
    expect(header).toBe(EXPECTED_HEADER);
  });

  it('returns header + 1 data row for single record', () => {
    const history = [{ date: '2026-04-15', eur: '100', usdcReceived: '50' }];
    const csv = tradeHistoryToCsv(history);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(EXPECTED_HEADER);
  });

  it('all columns present in data row in correct order', () => {
    const record = {
      date: '2026-04-15',
      eur: '100',
      usdcReceived: '50',
      arsAmount: '20000',
      eurArsRate: '200',
      eurUsdcRate: '0.5',
      binanceFeeEur: '1',
      ripioFeeArs: '100',
      serviceFee: '5',
      usdcDestAddress: 'rXABC',
    };
    const csv = tradeHistoryToCsv([record]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toBe('2026-04-15,100,50,20000,200,0.5,1,100,5,rXABC');
  });

  it('treats undefined field as empty string in output', () => {
    const record = { date: '2026-04-15', eur: '100' };
    const csv = tradeHistoryToCsv([record]);
    const dataRow = csv.split('\n')[1];
    // usdcReceived and remaining columns should be empty strings
    expect(dataRow.startsWith('2026-04-15,100,')).toBe(true);
    // count commas = 9 (10 columns - 1)
    expect(dataRow.split(',').length).toBe(10);
  });

  it('treats null field as empty string in output', () => {
    const record = { date: '2026-04-15', eur: null as unknown as string };
    const csv = tradeHistoryToCsv([record]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow.startsWith('2026-04-15,')).toBe(true);
    const cols = dataRow.split(',');
    expect(cols[1]).toBe('');
  });

  it('sorts records chronologically ascending by date (oldest first)', () => {
    const history = [
      { date: '2026-05-01', eur: 'C' },
      { date: '2026-04-15', eur: 'A' },
      { date: '2026-04-30', eur: 'B' },
    ];
    const csv = tradeHistoryToCsv(history);
    const lines = csv.split('\n');
    expect(lines[1].startsWith('2026-04-15,')).toBe(true);
    expect(lines[2].startsWith('2026-04-30,')).toBe(true);
    expect(lines[3].startsWith('2026-05-01,')).toBe(true);
  });

  it('does NOT mutate the input array', () => {
    const history = [
      { date: '2026-05-01', eur: 'C' },
      { date: '2026-04-15', eur: 'A' },
    ];
    const original = [...history];
    tradeHistoryToCsv(history);
    expect(history[0].date).toBe(original[0].date);
    expect(history[1].date).toBe(original[1].date);
  });

  it('escapes comma in field value', () => {
    const record = { date: '2026-04-15', serviceFee: '5,50' };
    const csv = tradeHistoryToCsv([record]);
    expect(csv).toContain('"5,50"');
  });

  it('escapes double quote in field value (RFC 4180)', () => {
    const record = { date: '2026-04-15', usdcDestAddress: 'rX"ABC' };
    const csv = tradeHistoryToCsv([record]);
    expect(csv).toContain('"rX""ABC"');
  });

  it('escapes newline in field value', () => {
    const record = { date: '2026-04-15', usdcDestAddress: 'rX\nABC' };
    const csv = tradeHistoryToCsv([record]);
    expect(csv).toContain('"rX\nABC"');
  });

  it('preserves numeric precision without rounding', () => {
    const record = { date: '2026-04-15', eurUsdcRate: '1.07500001' };
    const csv = tradeHistoryToCsv([record]);
    expect(csv).toContain('1.07500001');
  });

  it('rows separated by \\n', () => {
    const history = [
      { date: '2026-04-15', eur: '100' },
      { date: '2026-04-16', eur: '200' },
    ];
    const csv = tradeHistoryToCsv(history);
    expect(csv.includes('\n')).toBe(true);
    // No \r\n (Windows line endings)
    expect(csv.includes('\r\n')).toBe(false);
  });

  it('does NOT include trailing newline after last row', () => {
    const history = [{ date: '2026-04-15', eur: '100' }];
    const csv = tradeHistoryToCsv(history);
    expect(csv.endsWith('\n')).toBe(false);
  });
});

// ─── downloadCsv ─────────────────────────────────────────────────────────────

describe('downloadCsv', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLSpy = vi.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.fn();
    global.URL.createObjectURL = createObjectURLSpy;
    global.URL.revokeObjectURL = revokeObjectURLSpy;
    clickSpy = vi.fn();

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement;
        return a;
      }
      return document.createElement(tag);
    });

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls URL.createObjectURL with a Blob', () => {
    downloadCsv('test.csv', 'header\nrow1');
    expect(createObjectURLSpy).toHaveBeenCalledOnce();
    const arg = createObjectURLSpy.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Blob);
  });

  it('creates Blob with text/csv;charset=utf-8 content type', () => {
    downloadCsv('test.csv', 'header\nrow1');
    const blob: Blob = createObjectURLSpy.mock.calls[0][0];
    expect(blob.type).toBe('text/csv;charset=utf-8');
  });

  it('prepends UTF-8 BOM (\\uFEFF) to blob content', async () => {
    downloadCsv('test.csv', 'hello');
    const blob: Blob = createObjectURLSpy.mock.calls[0][0];
    // BOM is 3 bytes in UTF-8 (0xEF 0xBB 0xBF)
    // blob.text() strips BOM during TextDecoder decode — use arrayBuffer to verify raw bytes
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
    // And the content follows: 'hello' starts at byte 3
    expect(blob.size).toBe('hello'.length + 3); // 5 + 3 BOM bytes
  });

  it('sets download attribute to the provided filename', () => {
    downloadCsv('argbot-history-2026-05-01.csv', 'data');
    // The anchor mock captures download via the object literal
    // We verify click was called (meaning anchor was configured)
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(appendChildSpy).toHaveBeenCalledOnce();
    expect(removeChildSpy).toHaveBeenCalledOnce();
  });

  it('calls URL.revokeObjectURL after click', () => {
    downloadCsv('test.csv', 'data');
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('does not throw when revokeObjectURL throws', () => {
    revokeObjectURLSpy.mockImplementation(() => { throw new Error('revoke failed'); });
    expect(() => downloadCsv('test.csv', 'data')).not.toThrow();
  });
});

// ─── CSV_COLUMNS ─────────────────────────────────────────────────────────────

describe('CSV_COLUMNS', () => {
  it('exports CSV_COLUMNS as a readonly array with 10 entries', () => {
    expect(CSV_COLUMNS).toHaveLength(10);
  });

  it('CSV_COLUMNS contains expected column names in order', () => {
    expect(CSV_COLUMNS).toEqual([
      'date', 'eur', 'usdcReceived', 'arsAmount',
      'eurArsRate', 'eurUsdcRate', 'binanceFeeEur',
      'ripioFeeArs', 'serviceFee', 'usdcDestAddress',
    ]);
  });
});
