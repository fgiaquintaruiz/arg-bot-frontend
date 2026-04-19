import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from '../components/Calculator';

const mockData = {
  balances: { eur: '100.00', usdc: '500.00' },
  rate: '1.08',
  usdcArsRate: '1150.50',
  fees: {
    withdrawalUSDC_BEP20: 0.8,
    tradingRate: 0.001
  }
};

describe('Calculator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render calculator with title', () => {
    render(<Calculator data={mockData} />);
    expect(screen.getByText(/Calculadora/)).toBeInTheDocument();
  });

  it('should show loading state when data is null', () => {
    render(<Calculator data={null} />);
    expect(screen.getByText(/Cargando tasas/)).toBeInTheDocument();
  });

  it('should display ARS input', () => {
    render(<Calculator data={mockData} />);
    expect(screen.getByPlaceholderText('500000')).toBeInTheDocument();
  });

  it('should display EUR cost input', () => {
    render(<Calculator data={mockData} />);
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('should display savings section', () => {
    render(<Calculator data={mockData} />);
    expect(screen.getByText(/Ahorro vs Remitly/)).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', () => {
    const mockOnBack = vi.fn();
    render(<Calculator data={mockData} onBack={mockOnBack} />);
    fireEvent.click(screen.getByText(/Volver al menú/));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should not render back button when onBack is not provided', () => {
    render(<Calculator data={mockData} />);
    expect(screen.queryByText(/Volver al menú/)).not.toBeInTheDocument();
  });

  it('should display SEPA transfer button', () => {
    render(<Calculator data={mockData} />);
    expect(screen.getByText(/Abrir app del banco/)).toBeInTheDocument();
  });

  it('should display copy data button', () => {
    render(<Calculator data={mockData} />);
    expect(screen.getByText(/Ver datos para copiar/)).toBeInTheDocument();
  });

  it('should show IBAN config warning when no IBAN configured', () => {
    render(<Calculator data={mockData} />);
    expect(screen.getByText(/Configurá tu IBAN/)).toBeInTheDocument();
  });
});
