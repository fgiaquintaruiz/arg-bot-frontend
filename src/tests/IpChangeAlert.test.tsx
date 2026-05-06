import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IpChangeAlert from '../components/IpChangeAlert';

const defaultProps = {
  newIp: '198.51.100.7',
  onConfirm: vi.fn(),
  onDismiss: vi.fn(),
};

describe('IpChangeAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ───────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the new IP in a code element', () => {
      render(<IpChangeAlert {...defaultProps} />);
      const code = document.querySelector('code');
      expect(code).not.toBeNull();
      expect(code!.textContent).toBe('198.51.100.7');
    });

    it('renders "Actualizar en Binance" primary button', () => {
      render(<IpChangeAlert {...defaultProps} />);
      expect(screen.getByText('Actualizar en Binance')).toBeInTheDocument();
    });

    it('renders "Ignorar" secondary button', () => {
      render(<IpChangeAlert {...defaultProps} />);
      expect(screen.getByText('Ignorar')).toBeInTheDocument();
    });

    it('has role="alert" for accessibility', () => {
      render(<IpChangeAlert {...defaultProps} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-label="Alerta: la IP del servidor cambió"', () => {
      render(<IpChangeAlert {...defaultProps} />);
      expect(
        screen.getByLabelText('Alerta: la IP del servidor cambió')
      ).toBeInTheDocument();
    });
  });

  // ─── Interactions ────────────────────────────────────────────────────────────

  describe('interactions', () => {
    it('click "Actualizar en Binance" → calls onConfirm once', () => {
      render(<IpChangeAlert {...defaultProps} />);
      fireEvent.click(screen.getByText('Actualizar en Binance'));
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('click "Ignorar" → calls onDismiss once', () => {
      render(<IpChangeAlert {...defaultProps} />);
      fireEvent.click(screen.getByText('Ignorar'));
      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });

    it('click "Actualizar en Binance" → does NOT call onDismiss', () => {
      render(<IpChangeAlert {...defaultProps} />);
      fireEvent.click(screen.getByText('Actualizar en Binance'));
      expect(defaultProps.onDismiss).not.toHaveBeenCalled();
    });

    it('click "Ignorar" → does NOT call onConfirm', () => {
      render(<IpChangeAlert {...defaultProps} />);
      fireEvent.click(screen.getByText('Ignorar'));
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  // ─── Styles — Binance palette ────────────────────────────────────────────────

  describe('styles — Binance palette', () => {
    it('primary button has confirm-button class (Binance yellow)', () => {
      render(<IpChangeAlert {...defaultProps} />);
      const btn = screen.getByText('Actualizar en Binance');
      expect(btn.className).toContain('confirm-button');
    });

    it('secondary button has dismiss-button class (transparent)', () => {
      render(<IpChangeAlert {...defaultProps} />);
      const btn = screen.getByText('Ignorar');
      expect(btn.className).toContain('dismiss-button');
    });
  });
});
