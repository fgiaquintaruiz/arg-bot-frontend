import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import History from '../components/History';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { tradeHistoryToCsv, downloadCsv } from '../utils/csvExport';

// Module-level mock — hoisted by Vitest so it intercepts csvExport before History.tsx imports it
vi.mock('../utils/csvExport', () => ({
  tradeHistoryToCsv: vi.fn().mockReturnValue('mocked-csv'),
  downloadCsv: vi.fn(),
  CSV_COLUMNS: [
    'date', 'eur', 'usdcReceived', 'arsAmount', 'eurArsRate',
    'eurUsdcRate', 'binanceFeeEur', 'ripioFeeArs', 'serviceFee', 'usdcDestAddress',
  ],
}));

describe('History Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render history component with title', () => {
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Historial/)).toBeInTheDocument();
  });

  it('should show empty state when no trades exist', () => {
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/No hay operaciones registradas aún/)).toBeInTheDocument();
  });

  it('should display trade history from localStorage', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '5.00' },
      { date: '2024-01-02T10:00:00.000Z', eur: '250', usdcReceived: '268.75', savings: '12.50' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText('100 EUR → 107.50 USDC')).toBeInTheDocument();
    expect(screen.getByText('250 EUR → 268.75 USDC')).toBeInTheDocument();
  });

  // Change 1: banner "Ahorro total acumulado" eliminado
  it('no muestra el banner "Ahorro total acumulado" aunque savings sea positivo', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '5.00' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.queryByText(/Ahorro total/i)).not.toBeInTheDocument();
  });

  it('no muestra banner de ahorro cuando savings es 0', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.queryByText(/Ahorro total/i)).not.toBeInTheDocument();
    expect(screen.getByText(/100 EUR → 107\.50 USDC/)).toBeInTheDocument();
  });

  // Change 1: fecha aparece ANTES del texto principal en el DOM
  it('la fecha aparece antes del texto EUR→USDC en el DOM de la card', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);

    const card = screen.getByText(/100 EUR → 107\.50 USDC/).closest('[data-testid="history-card"]');
    expect(card).not.toBeNull();
    // The date element may be nested inside a header row div — use querySelector
    const dateEl = card.querySelector('[data-testid="card-date"]') || card.querySelector('small');
    const mainEl = Array.from(card.children).find(el => el.textContent.includes('EUR →'));
    expect(dateEl).toBeTruthy();
    expect(mainEl).toBeTruthy();
    // dateEl debe aparecer antes que mainEl en el innerHTML
    expect(card.innerHTML.indexOf(dateEl.textContent.trim())).toBeLessThan(
      card.innerHTML.indexOf('EUR →')
    );
  });

  it('should call onClose when back button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<History onClose={mockOnClose} />);
    fireEvent.click(screen.getByText(/Cerrar/));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('tiene un botón X en la esquina top-right con aria-label "Cerrar historial"', () => {
    const mockOnClose = vi.fn();
    render(<History onClose={mockOnClose} />);
    const closeBtn = screen.getByRole('button', { name: 'Cerrar historial' });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, 'invalid-json');
    expect(() => render(<History onClose={() => {}} />)).not.toThrow();
  });

  it('should handle empty array in localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, '[]');
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/No hay operaciones registradas aún/)).toBeInTheDocument();
  });

  it('muestra "?" cuando usdcReceived no está definido', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', savings: '5.00' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/100 EUR → \? USDC/)).toBeInTheDocument();
  });

  it('muestra empty state cuando localStorage tiene JSON no-array', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, '{"key":"value"}');
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/No hay operaciones registradas aún/)).toBeInTheDocument();
  });

  it('muestra arsAmount y eurArsRate cuando la entrada los tiene', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        arsAmount: '120000',
        eurArsRate: '1200.00',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);

    expect(screen.getByText(/120000 ARS/)).toBeInTheDocument();
    expect(screen.getByText(/1 EUR = 1200\.00 ARS/)).toBeInTheDocument();
  });

  it('muestra "—" cuando la entrada NO tiene arsAmount (entrada vieja)', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  // Change 2: nuevos campos
  it('muestra eurUsdcRate cuando el campo existe', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        eurUsdcRate: '1.0750',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/1 EUR = 1\.0750 USDC/)).toBeInTheDocument();
  });

  it('muestra "—" para eurUsdcRate cuando no existe', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/1 EUR = — USDC/)).toBeInTheDocument();
  });

  it('muestra binanceFeeEur cuando el campo existe', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        binanceFeeEur: '0.90',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Fee Binance: 0\.90 EUR/)).toBeInTheDocument();
  });

  it('muestra "—" para binanceFeeEur cuando no existe', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Fee Binance: — EUR/)).toBeInTheDocument();
  });

  it('muestra dirección USDC truncada cuando existe', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        usdcDestAddress: '0xABCDEF1234567890abcd',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    // primeros 6 y últimos 4: "0xABCD" y "abcd"
    expect(screen.getByText(/→ 0xABCD\.\.\.abcd/)).toBeInTheDocument();
  });

  it('truncateAddress: dirección corta (≤12 chars) se muestra completa sin truncar', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        usdcDestAddress: '0xABCDEF',  // 8 chars — ≤ 12
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/→ 0xABCDEF/)).toBeInTheDocument();
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });

  it('truncateAddress: dirección vacía muestra "—"', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        usdcDestAddress: '',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/→ —/)).toBeInTheDocument();
  });

  it('muestra "—" para usdcDestAddress cuando no existe', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/→ —/)).toBeInTheDocument();
  });

  it('muestra comisión Ripio guardada cuando existe', () => {
    localStorage.setItem('argbot_broker_name', 'Ripio');
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        ripioFeeArs: '1500',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Comisión Ripio: 1500 ARS/)).toBeInTheDocument();
  });

  it('muestra "— ARS" para comisión Ripio cuando no existe', () => {
    localStorage.setItem('argbot_broker_name', 'Ripio');
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Comisión Ripio: — ARS/)).toBeInTheDocument();
  });

  it('flujo editar/guardar comisión Ripio actualiza el valor mostrado y el localStorage', async () => {
    localStorage.setItem('argbot_broker_name', 'Ripio');
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);

    // click en ícono lápiz
    fireEvent.click(screen.getByLabelText(/editar comisión ripio/i));

    // aparece el input
    const input = screen.getByPlaceholderText(/monto/i);
    expect(input).toBeInTheDocument();

    // ingresar valor
    fireEvent.change(input, { target: { value: '2500' } });

    // guardar
    fireEvent.click(screen.getByLabelText(/guardar comisión ripio/i));

    // el valor actualizado se muestra
    expect(screen.getByText(/Comisión Ripio: 2500 ARS/)).toBeInTheDocument();

    // y se persiste en localStorage
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved[0].ripioFeeArs).toBe('2500');
  });
});

// ─── Change 1: Dynamic broker label ──────────────────────────────────────────

describe('Dynamic broker label', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra "Comisión broker:" cuando no hay nombre de broker en localStorage', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Comisión broker:/)).toBeInTheDocument();
  });

  it('muestra "Comisión Ripio:" cuando argbot_broker_name es "Ripio"', () => {
    localStorage.setItem('argbot_broker_name', 'Ripio');
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Comisión Ripio:/)).toBeInTheDocument();
  });

  it('muestra nombre de broker personalizado en la etiqueta de comisión', () => {
    localStorage.setItem('argbot_broker_name', 'Lemon');
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Comisión Lemon:/)).toBeInTheDocument();
  });
});

// ─── Change 2: Delete button with confirmation dialog ─────────────────────────

describe('Delete entry with confirmation dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('cada card tiene un botón de eliminar con aria-label "Eliminar operación"', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getAllByRole('button', { name: /Eliminar operación/i })).toHaveLength(1);
  });

  it('clickear el botón eliminar abre un diálogo de confirmación (no window.confirm)', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Eliminar operación/i }));
    expect(screen.getByText(/Eliminar esta operación del historial/)).toBeInTheDocument();
  });

  it('el diálogo tiene botones "Cancelar" y "Eliminar"', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Eliminar operación/i }));
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Eliminar$/i })).toBeInTheDocument();
  });

  it('"Cancelar" cierra el diálogo sin eliminar la entrada', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Eliminar operación/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByText(/Eliminar esta operación del historial/)).not.toBeInTheDocument();
    expect(screen.getByText(/100 EUR → 107\.50 USDC/)).toBeInTheDocument();
  });

  it('"Eliminar" quita la entrada del DOM y del localStorage', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' },
      { date: '2024-01-02T10:00:00.000Z', eur: '200', usdcReceived: '215.00', savings: '0' },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);

    // The history is reversed in display — first card shown is the last entry (200 EUR)
    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar operación/i });
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: /^Eliminar$/i }));

    // The deleted entry should no longer appear
    expect(screen.getAllByTestId('history-card')).toHaveLength(1);

    // localStorage should also have only 1 entry
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved).toHaveLength(1);
  });
});

// ─── Change 3: Testnet visual distinction ─────────────────────────────────────

describe('Testnet visual distinction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra badge TESTNET cuando txId empieza con "TESTNET-"', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        txId: 'TESTNET-1234567890',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText('TESTNET')).toBeInTheDocument();
  });

  it('no muestra badge TESTNET cuando txId es un hash real', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        txId: '0xABCDEF1234',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.queryByText('TESTNET')).not.toBeInTheDocument();
  });

  it('no muestra badge TESTNET cuando no hay txId', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.queryByText('TESTNET')).not.toBeInTheDocument();
  });

  it('la card testnet tiene la clase CSS "card-testnet"', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        txId: 'TESTNET-9876',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    const card = screen.getByTestId('history-card');
    // CSS modules transform class names — check via data attribute or that badge exists
    expect(screen.getByText('TESTNET')).toBeInTheDocument();
    // The card should have a testnet-specific class applied (CSS modules use mangled names)
    expect(card.className).toMatch(/testnet/i);
  });
});

// ─── Export CSV button ────────────────────────────────────────────────────────

describe('Export CSV button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders "Exportar CSV" button when history has entries', () => {
    const trades = [{ date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50' }];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Exportar CSV/i)).toBeInTheDocument();
  });

  it('button has aria-label "Exportar historial como CSV"', () => {
    const trades = [{ date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50' }];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Exportar historial como CSV' })).toBeInTheDocument();
  });

  it('button is disabled when history is empty', () => {
    render(<History onClose={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Exportar historial como CSV' });
    expect(btn).toBeDisabled();
  });

  it('button is enabled when history has at least one entry', () => {
    const trades = [{ date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50' }];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Exportar historial como CSV' });
    expect(btn).not.toBeDisabled();
  });

  it('clicking button calls downloadCsv with filename matching argbot-history-YYYY-MM-DD.csv pattern', () => {
    const trades = [{ date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50' }];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar historial como CSV' }));
    expect(downloadCsv).toHaveBeenCalledOnce();
    const [filename] = downloadCsv.mock.calls[0];
    expect(filename).toMatch(/^argbot-history-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('clicking button calls tradeHistoryToCsv with the full history array', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50' },
      { date: '2024-01-02T10:00:00.000Z', eur: '200', usdcReceived: '215.00' },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar historial como CSV' }));
    expect(tradeHistoryToCsv).toHaveBeenCalledOnce();
    const [passedHistory] = tradeHistoryToCsv.mock.calls[0];
    expect(passedHistory).toHaveLength(2);
    expect(passedHistory[0].eur).toBe('100');
    expect(passedHistory[1].eur).toBe('200');
  });

  it('clicking button does NOT modify localStorage trade_history', () => {
    const trades = [{ date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50' }];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    const beforeClick = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar historial como CSV' }));
    const afterClick = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY);
    expect(afterClick).toBe(beforeClick);
  });

  it('handleExportCsv: silently handles errors without crashing (catch branch)', () => {
    const trades = [{ date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50' }];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    // Make tradeHistoryToCsv throw to trigger the catch branch
    tradeHistoryToCsv.mockImplementation(() => { throw new Error('csv error'); });
    render(<History onClose={() => {}} />);
    // Should not throw when clicking
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Exportar historial como CSV' }));
    }).not.toThrow();
  });
});
