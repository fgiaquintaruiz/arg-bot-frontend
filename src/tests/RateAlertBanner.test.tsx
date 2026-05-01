import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import RateAlertBanner from '../components/RateAlertBanner';

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

const baseProps = {
  pair: 'EUR/ARS',
  direction: 'upper' as const,
  currentRate: 1.1234,
  threshold: 1.10,
  onDismiss: vi.fn(),
};

describe('RateAlertBanner', () => {
  it('renders with role="alert"', () => {
    render(<RateAlertBanner {...baseProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('aria-label contains the pair label', () => {
    render(<RateAlertBanner {...baseProps} />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-label', expect.stringContaining('EUR/ARS'));
  });

  it('upper direction → renders ≥ symbol', () => {
    render(<RateAlertBanner {...baseProps} direction="upper" />);
    expect(screen.getByRole('alert')).toHaveTextContent('≥');
  });

  it('lower direction → renders ≤ symbol', () => {
    render(<RateAlertBanner {...baseProps} direction="lower" />);
    expect(screen.getByRole('alert')).toHaveTextContent('≤');
  });

  it('upper direction → uses Binance yellow color (#F0B90B) in container', () => {
    render(<RateAlertBanner {...baseProps} direction="upper" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveStyle({ color: '#F0B90B' });
  });

  it('lower direction → uses Binance green color (#0ECB81) in container', () => {
    render(<RateAlertBanner {...baseProps} direction="lower" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveStyle({ color: '#0ECB81' });
  });

  it('renders pair label', () => {
    render(<RateAlertBanner {...baseProps} />);
    expect(screen.getByRole('alert')).toHaveTextContent('EUR/ARS');
  });

  it('renders threshold value', () => {
    render(<RateAlertBanner {...baseProps} threshold={1.10} />);
    expect(screen.getByRole('alert')).toHaveTextContent('1.1');
  });

  it('renders currentRate formatted to 4 decimal places', () => {
    render(<RateAlertBanner {...baseProps} currentRate={1.1234} />);
    expect(screen.getByRole('alert')).toHaveTextContent('1.1234');
  });

  it('click Descartar → calls onDismiss once', () => {
    const onDismiss = vi.fn();
    render(<RateAlertBanner {...baseProps} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Descartar'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('Descartar button has aria-label including pair', () => {
    render(<RateAlertBanner {...baseProps} pair="EUR/USDC" />);
    const btn = screen.getByText('Descartar');
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('EUR/USDC'));
  });
});
