import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('should display total savings', () => {
    const trades = [
      { date: '2024-01-01T10:00:00.000Z', eur: '100', usdcReceived: '107.50', savings: '5.00' }
    ];
    localStorage.setItem('trade_history', JSON.stringify(trades));
    render(<History onClose={() => {}} />);
    expect(screen.getByText(/Ahorro total acumulado/)).toBeInTheDocument();
  });

  it('should call onClose when back button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<History onClose={mockOnClose} />);
    fireEvent.click(screen.getByText(/Volver al Menú/));
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
});
