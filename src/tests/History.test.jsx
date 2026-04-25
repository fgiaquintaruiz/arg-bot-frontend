import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import History from '../components/History';

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
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText('100 EUR → 107.50 USDC')).toBeInTheDocument();
    expect(screen.getByText('250 EUR → 268.75 USDC')).toBeInTheDocument();
  });

  // Change 1: banner "Ahorro total acumulado" eliminado
  it('no muestra el banner "Ahorro total acumulado" aunque savings sea positivo', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '5.00' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.queryByText(/Ahorro total/i)).not.toBeInTheDocument();
  });

  it('no muestra banner de ahorro cuando savings es 0', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.queryByText(/Ahorro total/i)).not.toBeInTheDocument();
    expect(screen.getByText(/100 EUR → 107\.50 USDC/)).toBeInTheDocument();
  });

  // Change 1: fecha aparece ANTES del texto principal en el DOM
  it('la fecha aparece antes del texto EUR→USDC en el DOM de la card', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);

    const card = screen.getByText(/100 EUR → 107\.50 USDC/).closest('[data-testid="history-card"]');
    expect(card).not.toBeNull();
    const children = Array.from(card.children);
    const dateEl = children.find(el => el.tagName === 'SMALL' || el.getAttribute('data-testid') === 'card-date');
    const mainEl = children.find(el => el.textContent.includes('EUR →'));
    expect(dateEl).toBeTruthy();
    expect(mainEl).toBeTruthy();
    // dateEl debe aparecer antes que mainEl
    expect(card.innerHTML.indexOf(dateEl.textContent.trim())).toBeLessThan(
      card.innerHTML.indexOf('EUR →')
    );
  });

  it('should call onClose when back button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<History onClose={mockOnClose} />);
    fireEvent.click(screen.getByText(/Volver al menú/));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('trade_history', 'invalid-json');
    expect(() => render(<History onClose={() => {}} />)).not.toThrow();
  });

  it('should handle empty array in localStorage', () => {
    localStorage.setItem('trade_history', '[]');
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/No hay operaciones registradas aún/)).toBeInTheDocument();
  });

  it('muestra "?" cuando usdcReceived no está definido', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', savings: '5.00' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/100 EUR → \? USDC/)).toBeInTheDocument();
  });

  it('muestra empty state cuando localStorage tiene JSON no-array', () => {
    localStorage.setItem('trade_history', '{"key":"value"}');
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
    localStorage.setItem('trade_history', JSON.stringify(trades));
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
    localStorage.setItem('trade_history', JSON.stringify(trades));
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
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/1 EUR = 1\.0750 USDC/)).toBeInTheDocument();
  });

  it('muestra "—" para eurUsdcRate cuando no existe', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
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
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Fee Binance: 0\.90 EUR/)).toBeInTheDocument();
  });

  it('muestra "—" para binanceFeeEur cuando no existe', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
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
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    // primeros 6 y últimos 4: "0xABCD" y "abcd"
    expect(screen.getByText(/→ 0xABCD\.\.\.abcd/)).toBeInTheDocument();
  });

  it('muestra "—" para usdcDestAddress cuando no existe', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/→ —/)).toBeInTheDocument();
  });

  it('muestra comisión Ripio guardada cuando existe', () => {
    const trades = [
      {
        date: '2024-01-01T10:00:00.000Z',
        eur: '100',
        usdcReceived: '107.50',
        savings: '0',
        ripioFeeArs: '1500',
      }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Comisión Ripio: 1500 ARS/)).toBeInTheDocument();
  });

  it('muestra "— ARS" para comisión Ripio cuando no existe', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Comisión Ripio: — ARS/)).toBeInTheDocument();
  });

  it('flujo editar/guardar comisión Ripio actualiza el valor mostrado y el localStorage', async () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '0' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
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
    const saved = JSON.parse(localStorage.getItem('trade_history') || '[]');
    expect(saved[0].ripioFeeArs).toBe('2500');
  });
});
