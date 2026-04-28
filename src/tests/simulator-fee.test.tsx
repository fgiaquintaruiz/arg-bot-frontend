import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TradingWizard from '../components/TradingWizard';

vi.mock('../components/Trade', () => ({
  default: () => <div data-testid="trade-mock" />,
}));
vi.mock('../components/Withdraw', () => ({
  default: () => <div data-testid="withdraw-mock" />,
}));

const mockData: any = {
  balances: { eur: '100.00', usdc: '500.00' },
  rate: '1.08',
  usdcArsRate: '1150.50',
  // Note: no withdrawalUSDC_BEP20 — that field has been removed from the config
  fees: { tradingRate: 0.001 },
};

beforeEach(() => {
  localStorage.clear();
});

describe('Simulator Step 0 — withdrawal fee corrected to 0', () => {
  it('does NOT subtract a 0.8 USDC withdrawal fee from EUR cost calculation', () => {
    render(<TradingWizard data={mockData} />);

    const arsInput = screen.getByPlaceholderText('500000') as HTMLInputElement;
    fireEvent.change(arsInput, { target: { value: '500000' } });

    // Math without 0.8 fee:
    //   usdcNeeded = 500000 / 1150.50 = 434.594...
    //   eurBefore = 434.594 / 1.08 = 402.40
    //   total = 402.40 * 1.001 + 1.00 (SEPA) = 403.80
    // With the (wrong) 0.8 fee it would be ~404.54
    // So the displayed EUR must be < 404 to confirm the deduction is gone.
    const eurInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    const eurValue = parseFloat(eurInput.value);

    expect(eurValue).toBeGreaterThan(403);
    expect(eurValue).toBeLessThan(404);
  });

  it('does NOT show "+ 0.80 USDC" fee line in fee breakdown', () => {
    render(<TradingWizard data={mockData} />);

    const arsInput = screen.getByPlaceholderText('500000');
    fireEvent.change(arsInput, { target: { value: '500000' } });

    // The wrong line was: "Retiro Binance BEP20  + 0.80 USDC"
    // Either the line is removed entirely, or the value is shown as "0 USDC" / "+ 0.00 USDC"
    expect(screen.queryByText(/\+\s*0\.80\s*USDC/)).not.toBeInTheDocument();
  });
});
