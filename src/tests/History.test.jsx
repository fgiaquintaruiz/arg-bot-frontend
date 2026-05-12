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
    // Registro con eurArsRate guardado → PRIORIDAD 1: mostrar ese valor directo (tasa real de la operación)
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
    // Prioridad 1: usar eurArsRate guardado, sin sufijo ≈
    expect(screen.getByText(/1 EUR = 1\.200,00 ARS/)).toBeInTheDocument();
    expect(screen.queryByText(/Tasa EUR\/ARS no disponible/)).not.toBeInTheDocument();
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

  it('flujo editar/guardar comisión Ripio vía modal actualiza el valor mostrado y el localStorage', async () => {
    // Replaced: inline pencil edit removed — now editing happens via the card-tap edit modal
    localStorage.setItem('argbot_broker_name', 'Ripio');
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);

    // abrir modal de edición tocando la card
    fireEvent.click(screen.getByTestId('history-card'));

    // aparece el input de comisión
    const feeInput = screen.getByLabelText(/Comisión.*ARS/i);
    expect(feeInput).toBeInTheDocument();

    // ingresar valor
    fireEvent.change(feeInput, { target: { value: '2500' } });

    // guardar
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    // el valor actualizado se muestra en la card
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

// ─── Change 3.5: Tasa EUR/ARS correcta en historial ───────────────────────────

describe('EUR/ARS rate via USDC/ARS override', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('Test 1: muestra tasa EUR/ARS calculada cuando eurUsdcRate y usdc_ars_override están disponibles', () => {
    // Arrange: USDC/ARS = 1000, eurUsdcRate = 1.05 → EUR/ARS = 1050.00
    localStorage.setItem(STORAGE_KEYS.USDC_ARS_OVERRIDE, '1000');
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        eurUsdcRate: '1.05',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));

    render(<History onClose={() => {}} />);

    // P2 (estimado): 1.05 * 1000 = 1050 — sin eurArsRate guardado → muestra con ≈
    expect(screen.getByText(/1 EUR ≈ 1\.050,00 ARS/)).toBeInTheDocument();
    // NO debe aparecer el warning de configuración
    expect(screen.queryByText(/Verificá la tasa de venta de USDC/)).not.toBeInTheDocument();
  });

  it('Test 2: muestra warning cuando usdc_ars_override está vacío o ausente', () => {
    // Arrange: usdc_ars_override vacío (no seteado)
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        eurUsdcRate: '1.05',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));

    render(<History onClose={() => {}} />);

    // Debe mostrar el banner de warning
    expect(screen.getByText(/Verificá la tasa de venta de USDC/)).toBeInTheDocument();
    // El link "Configurar" debe estar presente
    expect(screen.getByRole('button', { name: /Configurar/i })).toBeInTheDocument();
  });

  it('Test 3: muestra "Tasa EUR/ARS no disponible" en cada card cuando falta usdc_ars_override', () => {
    // Arrange: no hay usdc_ars_override
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        eurUsdcRate: '1.05',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));

    render(<History onClose={() => {}} />);

    // El card debe mostrar "no disponible" para la tasa EUR/ARS
    expect(screen.getByText(/Tasa EUR\/ARS no disponible/)).toBeInTheDocument();
    // No debe mostrar una tasa calculada
    expect(screen.queryByText(/1 EUR = .* ARS/)).not.toBeInTheDocument();
  });

  it('Test 4 (P2): sin eurArsRate guardado, con eurUsdcRate y override, muestra tasa estimada con ≈', () => {
    // P2: no hay eurArsRate en el registro → se estima con eurUsdcRate × usdc_ars_override
    localStorage.setItem(STORAGE_KEYS.USDC_ARS_OVERRIDE, '1000');
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        eurUsdcRate: '1.05',
        // eurArsRate intencionalmente ausente
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));

    render(<History onClose={() => {}} />);

    // Debe mostrar el prefijo ≈ indicando que es una tasa estimada (no real)
    expect(screen.getByText(/1 EUR ≈ 1\.050,00 ARS/)).toBeInTheDocument();
    // No debe mostrar "no disponible"
    expect(screen.queryByText(/Tasa EUR\/ARS no disponible/)).not.toBeInTheDocument();
    // No debe mostrar "=" (solo "≈" para estimados)
    expect(screen.queryByText(/1 EUR = 1\.050,00 ARS/)).not.toBeInTheDocument();
  });
});

// ─── Commit 1: mode field migration ──────────────────────────────────────────

describe('mode field migration on load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('registro con mode: "prod" → state mantiene mode: "prod"', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        mode: 'prod',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    // El componente carga — si llegara a mostrar algo basado en mode lo verificaríamos,
    // pero aquí verificamos que no rompa y que el registro esté visible
    expect(screen.getByText(/100 EUR → 107\.50 USDC/)).toBeInTheDocument();
  });

  it('registro sin mode → state lo migra a mode: "unknown" (no rompe el render)', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        // sin campo mode
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/100 EUR → 107\.50 USDC/)).toBeInTheDocument();
  });

  it('registro con mode: "testnet" → state mantiene mode: "testnet"', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        mode: 'testnet',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/100 EUR → 107\.50 USDC/)).toBeInTheDocument();
  });
});

// ─── Commit 2: manual creation modal ─────────────────────────────────────────

describe('New entry modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('botón "+ Nueva operación" es visible en el header', () => {
    render(<History onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /Nueva operación/i })).toBeInTheDocument();
  });

  it('modal de creación aparece al hacer click en "+ Nueva operación"', () => {
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva operación/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('validación: fecha futura → error visible', () => {
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva operación/i }));

    // Setear fecha futura
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDateStr = tomorrow.toISOString().slice(0, 10);
    const dateInput = screen.getByLabelText(/Fecha/i);
    fireEvent.change(dateInput, { target: { value: futureDateStr } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar nueva operación/i }));
    // Verify at least one error alert appeared and it mentions "fecha"
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some(a => /fecha/i.test(a.textContent))).toBe(true);
  });

  it('validación: modo no seleccionado → error visible al intentar guardar', () => {
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva operación/i }));

    // Llenar campos requeridos excepto mode
    const today = new Date().toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText(/Fecha/i), { target: { value: today } });
    fireEvent.change(screen.getByLabelText(/Monto EUR/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/USDC recibido/i), { target: { value: '107.5' } });
    // No seleccionar modo

    fireEvent.click(screen.getByRole('button', { name: /Guardar nueva operación/i }));
    // Verify at least one error alert appeared and it mentions "modo"
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some(a => /modo/i.test(a.textContent))).toBe(true);
  });

  it('validación: EUR negativo → error visible', () => {
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva operación/i }));

    const today = new Date().toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText(/Fecha/i), { target: { value: today } });

    const modeSelect = screen.getByLabelText(/Modo/i);
    fireEvent.change(modeSelect, { target: { value: 'prod' } });

    fireEvent.change(screen.getByLabelText(/Monto EUR/i), { target: { value: '-50' } });
    fireEvent.change(screen.getByLabelText(/USDC recibido/i), { target: { value: '107.5' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar nueva operación/i }));
    // Verify at least one error alert appeared and it mentions "EUR"
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some(a => /EUR/i.test(a.textContent))).toBe(true);
  });

  it('submit con datos válidos → registro aparece en la lista', () => {
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva operación/i }));

    const today = new Date().toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText(/Fecha/i), { target: { value: today } });
    fireEvent.change(screen.getByLabelText(/Modo/i), { target: { value: 'prod' } });
    fireEvent.change(screen.getByLabelText(/Monto EUR/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/USDC recibido/i), { target: { value: '215' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar nueva operación/i }));

    expect(screen.getByText(/200 EUR → 215 USDC/)).toBeInTheDocument();
  });

  it('submit válido → modal se cierra', () => {
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva operación/i }));

    const today = new Date().toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText(/Fecha/i), { target: { value: today } });
    fireEvent.change(screen.getByLabelText(/Modo/i), { target: { value: 'prod' } });
    fireEvent.change(screen.getByLabelText(/Monto EUR/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/USDC recibido/i), { target: { value: '160' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar nueva operación/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('registro nuevo sobrevive reload (está en localStorage)', () => {
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva operación/i }));

    const today = new Date().toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText(/Fecha/i), { target: { value: today } });
    fireEvent.change(screen.getByLabelText(/Modo/i), { target: { value: 'testnet' } });
    fireEvent.change(screen.getByLabelText(/Monto EUR/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/USDC recibido/i), { target: { value: '53.5' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar nueva operación/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0].eur).toBe('50');
    expect(saved[0].usdcReceived).toBe('53.5');
    expect(saved[0].mode).toBe('testnet');
  });
});

// ─── Edit modal (card-tappable) ───────────────────────────────────────────────

describe('Edit modal (card-tappable)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const sampleTrade = {
    date: '2024-03-15T14:30:00.000Z',
    eur: '100',
    usdcReceived: '107.50',
    savings: '0',
    mode: 'prod',
    arsAmount: '120000',
    eurUsdcRate: '1.075',
    binanceFeeEur: '0.90',
    ripioFeeArs: '1500',
    eurArsRate: '1200.00',
  };

  it('cada card del historial tiene role="button"', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    const card = screen.getByTestId('history-card');
    expect(card).toHaveAttribute('role', 'button');
  });

  it('click en card abre el modal de edición', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    const card = screen.getByTestId('history-card');
    fireEvent.click(card);
    expect(screen.getByRole('dialog', { name: /Editar operación/i })).toBeInTheDocument();
  });

  it('modal de edición muestra datos del registro (fecha, EUR, USDC)', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));
    // fecha formateada (15 mar. 2024 o similar)
    expect(screen.getByRole('dialog', { name: /Editar operación/i })).toBeInTheDocument();
    // EUR amount visible en el modal
    expect(screen.getAllByText(/100/).length).toBeGreaterThan(0);
    // USDC visible en el modal
    expect(screen.getAllByText(/107\.50/).length).toBeGreaterThan(0);
  });

  it('los campos arsAmount y ripioFeeArs son editables (input type="number")', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));
    const arsInput = screen.getByLabelText(/Monto ARS/i);
    const feeInput = screen.getByLabelText(/Comisión.*ARS/i);
    expect(arsInput).toHaveAttribute('type', 'number');
    expect(feeInput).toHaveAttribute('type', 'number');
  });

  it('los campos no editables son readonly (ej: EUR amount)', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));
    // El campo EUR debe ser readonly — no debe ser un input editable
    // Verificamos que no haya un input con label "EUR" en el modal
    // (el valor se muestra como texto estático)
    const dialog = screen.getByRole('dialog', { name: /Editar operación/i });
    const editableInputs = dialog.querySelectorAll('input:not([readonly])');
    // Solo arsAmount y ripioFeeArs son editables — máximo 2 inputs no-readonly
    expect(editableInputs.length).toBeLessThanOrEqual(2);
  });

  it('submit con arsAmount válido guarda en localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const arsInput = screen.getByLabelText(/Monto ARS/i);
    fireEvent.change(arsInput, { target: { value: '135000' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar.*edición|Guardar cambios/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved[0].arsAmount).toBe('135000');
  });

  it('submit con arsAmount negativo muestra error y no cierra el modal', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const arsInput = screen.getByLabelText(/Monto ARS/i);
    fireEvent.change(arsInput, { target: { value: '-5000' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar.*edición|Guardar cambios/i }));

    // Modal debe seguir abierto
    expect(screen.getByRole('dialog', { name: /Editar operación/i })).toBeInTheDocument();
    // Debe haber un mensaje de error
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('cancelar modal no guarda cambios', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const arsInput = screen.getByLabelText(/Monto ARS/i);
    fireEvent.change(arsInput, { target: { value: '999999' } });

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    // Modal cerrado
    expect(screen.queryByRole('dialog', { name: /Editar operación/i })).not.toBeInTheDocument();
    // localStorage sin cambios
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved[0].arsAmount).toBe('120000');
  });

  it('click en botón eliminar (tacho) NO abre el modal de edición', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);

    const deleteBtn = screen.getByRole('button', { name: /Eliminar operación/i });
    fireEvent.click(deleteBtn);

    // Debe abrir diálogo de confirmación de borrado, NO el modal de edición
    expect(screen.getByText(/Eliminar esta operación del historial/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /Editar operación/i })).not.toBeInTheDocument();
  });

  it('submit válido con ripioFeeArs guarda el nuevo valor en localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const feeInput = screen.getByLabelText(/Comisión.*ARS/i);
    fireEvent.change(feeInput, { target: { value: '2500' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar.*edición|Guardar cambios/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved[0].ripioFeeArs).toBe('2500');
  });

  it('submit válido cierra el modal', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    fireEvent.click(screen.getByRole('button', { name: /Guardar.*edición|Guardar cambios/i }));

    expect(screen.queryByRole('dialog', { name: /Editar operación/i })).not.toBeInTheDocument();
  });
});

// ─── B.2: eurArsRate recalculation on arsAmount edit ─────────────────────────

describe('Edit modal — eurArsRate recalculation (B.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const sampleTrade = {
    date: '2024-03-15T14:30:00.000Z',
    eur: '100',
    usdcReceived: '107.50',
    savings: '0',
    mode: 'prod',
    arsAmount: '120000',
    eurUsdcRate: '1.075',
    eurArsRate: '1200.00',
  };

  it('recalcula eurArsRate cuando arsAmount cambia y eurUsdcRate existe', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const arsInput = screen.getByLabelText(/Monto ARS/i);
    fireEvent.change(arsInput, { target: { value: '135000' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    // 1.075 * (135000 / 107.50) = 1350.00
    expect(saved[0].eurArsRate).toBe('1350.00');
    expect(saved[0].arsAmount).toBe('135000');
  });

  it('NO recalcula eurArsRate cuando solo ripioFeeArs cambia', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const feeInput = screen.getByLabelText(/Comisión.*ARS/i);
    fireEvent.change(feeInput, { target: { value: '2500' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved[0].eurArsRate).toBe('1200.00');
  });

  it('NO recalcula eurArsRate cuando arsAmount NO cambió', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    // Only change ripioFeeArs, arsAmount stays as '120000'
    const feeInput = screen.getByLabelText(/Comisión.*ARS/i);
    fireEvent.change(feeInput, { target: { value: '3000' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved[0].eurArsRate).toBe('1200.00');
  });

  it('muestra mensaje de éxito después de guardar con recálculo', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const arsInput = screen.getByLabelText(/Monto ARS/i);
    fireEvent.change(arsInput, { target: { value: '135000' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    // The success message contains the full text — use a partial match that's unique to it
    expect(screen.getByText(/Tasa EUR\/ARS actualizada/)).toBeInTheDocument();
    // Verify the success message contains the formatted rate (multiple elements may match 1.350,00)
    expect(screen.getAllByText(/1\.350,00 ARS/).length).toBeGreaterThanOrEqual(1);
  });

  it('mensaje de éxito NO aparece cuando solo ripioFeeArs cambia', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const feeInput = screen.getByLabelText(/Comisión.*ARS/i);
    fireEvent.change(feeInput, { target: { value: '2500' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    expect(screen.queryByText(/Tasa EUR\/ARS actualizada/)).not.toBeInTheDocument();
  });

  it('muestra advertencia cuando eurUsdcRate falta y arsAmount cambia', () => {
    const tradeWithoutEurUsdc = { ...sampleTrade, eurUsdcRate: undefined, eurArsRate: undefined };
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([tradeWithoutEurUsdc]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const arsInput = screen.getByLabelText(/Monto ARS/i);
    fireEvent.change(arsInput, { target: { value: '135000' } });

    expect(screen.getByText(/No se puede recalcular la tasa/)).toBeInTheDocument();
  });

  it('NO persiste eurArsRate cuando eurUsdcRate falta', () => {
    const tradeWithoutEurUsdc = { ...sampleTrade, eurUsdcRate: undefined, eurArsRate: undefined };
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([tradeWithoutEurUsdc]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const arsInput = screen.getByLabelText(/Monto ARS/i);
    fireEvent.change(arsInput, { target: { value: '135000' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved[0].eurArsRate).toBeUndefined();
    expect(saved[0].arsAmount).toBe('135000');
  });

  it('después del recálculo, la card muestra tasa sin "≈"', () => {
    // Trade with eurUsdcRate but NO eurArsRate — estimated display before edit
    const tradeEstimated = { ...sampleTrade, eurArsRate: undefined };
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([tradeEstimated]));
    localStorage.setItem(STORAGE_KEYS.USDC_ARS_OVERRIDE, '1100');
    render(<History onClose={() => {}} />);

    // Before edit — should show ≈ (estimated from eurUsdcRate * usdcArsRate)
    expect(screen.getByText(/1 EUR ≈/)).toBeInTheDocument();

    // Open edit modal, change arsAmount
    fireEvent.click(screen.getByTestId('history-card'));
    const arsInput = screen.getByLabelText(/Monto ARS/i);
    fireEvent.change(arsInput, { target: { value: '135000' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    // After save — the card-rate span should show "1 EUR =" (no ≈)
    const card = screen.getByTestId('history-card');
    // card-rate span contains the rate display — after recalc it must NOT contain ≈
    expect(card.innerHTML).not.toContain('≈');
    // The card should display the new exact rate (not estimated)
    expect(screen.queryByText(/1 EUR ≈/)).not.toBeInTheDocument();
  });

  it('NO recalcula cuando arsAmount se vacía', () => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify([sampleTrade]));
    render(<History onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('history-card'));

    const arsInput = screen.getByLabelText(/Monto ARS/i);
    fireEvent.change(arsInput, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved[0].eurArsRate).toBe('1200.00');
  });
});

// ─── Delete entry — testnet vs real mode ─────────────────────────────────────

describe('Delete entry — testnet vs real mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('Test A: entrada TESTNET se elimina inmediatamente sin diálogo de confirmación', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        txId: 'TESTNET-abc123',
      },
      {
        date: '2024-01-02T10:00:00.000Z',
        eur: '200',
        usdcReceived: '215.00',
        savings: '0',
        txId: '0xREAL1234',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);

    // History is displayed in reverse: index 0 = last entry (real), index 1 = first entry (testnet)
    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar operación/i });
    // The testnet entry is the second card (reversed display) — deleteButtons[1]
    fireEvent.click(deleteButtons[1]);

    // Confirmation dialog must NOT appear
    expect(screen.queryByText(/Eliminar esta operación del historial/)).not.toBeInTheDocument();

    // The testnet entry must be removed from the DOM immediately
    expect(screen.queryByText(/100 EUR → 107\.50 USDC/)).not.toBeInTheDocument();

    // localStorage must reflect the deletion (only the real entry remains)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0].txId).toBe('0xREAL1234');
  });

  it('Test B: entrada REAL muestra diálogo de confirmación (regression guard)', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '150',
        usdcReceived: '160.00',
        savings: '0',
        txId: '0xREAL5678',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trades));
    render(<History onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Eliminar operación/i }));

    // Confirmation dialog MUST appear
    expect(screen.getByText(/Eliminar esta operación del historial/)).toBeInTheDocument();

    // localStorage must NOT be modified yet (entry still present until confirmed)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0].txId).toBe('0xREAL5678');
  });
});
