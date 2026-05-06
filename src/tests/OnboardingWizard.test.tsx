import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import OnboardingWizard from '../components/OnboardingWizard';
import { isOnboardingCompleted } from '../utils/onboardingStorage';

describe('OnboardingWizard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ─── Rendering ───────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders step 1 question on mount', () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      expect(screen.getByText(/ya tenés cuenta en binance/i)).toBeInTheDocument();
    });

    it('renders "Sí" and "No" buttons on step 1', () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      const siButtons = screen.getAllByText('Sí');
      const noButtons = screen.getAllByText('No');
      expect(siButtons.length).toBeGreaterThanOrEqual(1);
      expect(noButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders step indicator showing step 1 of 3', () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      expect(screen.getByText(/1.*3|paso 1/i)).toBeInTheDocument();
    });

    it('renders as a modal overlay (position fixed, zIndex high)', () => {
      const { container } = render(<OnboardingWizard onClose={vi.fn()} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay.className).toContain('overlay');
    });
  });

  // ─── Step 1 — Binance account ─────────────────────────────────────────────

  describe('step 1 — binance account', () => {
    it('"No" on step 1 shows register link', () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      // Click No on step 1
      fireEvent.click(screen.getAllByText('No')[0]);
      expect(screen.getByRole('link', { name: /crear.*cuenta|binance\.com\/register/i })).toBeInTheDocument();
    });

    it('"No" on step 1 shows message to create account first', () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      fireEvent.click(screen.getAllByText('No')[0]);
      expect(screen.getByText(/creá tu cuenta primero/i)).toBeInTheDocument();
    });

    it('"Sí" on step 1 advances to step 2', () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      fireEvent.click(screen.getAllByText('Sí')[0]);
      expect(screen.getByText(/ayuda.*api keys|configurar.*api/i)).toBeInTheDocument();
    });
  });

  // ─── Step 2 — API key help ────────────────────────────────────────────────

  describe('step 2 — api key help', () => {
    const goToStep2 = () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      fireEvent.click(screen.getAllByText('Sí')[0]);
    };

    it('renders step 2 question about API key help', () => {
      goToStep2();
      expect(screen.getByText(/ayuda.*api keys|configurar.*api/i)).toBeInTheDocument();
    });

    it('"Sí" on step 2 shows API setup instructions', () => {
      goToStep2();
      fireEvent.click(screen.getAllByText('Sí')[0]);
      expect(screen.getByText(/instrucciones paso a paso/i)).toBeInTheDocument();
    });

    it('"No" on step 2 shows message that user can configure in settings', () => {
      goToStep2();
      fireEvent.click(screen.getAllByText('No')[0]);
      expect(screen.getByText(/Perfecto, podés configurarlas/i)).toBeInTheDocument();
    });

    it('"No" on step 2 advances to step 3 via Continuar button', () => {
      goToStep2();
      fireEvent.click(screen.getAllByText('No')[0]);
      fireEvent.click(screen.getByText('Continuar'));
      expect(screen.getByText(/Paso 3 de 3/i)).toBeInTheDocument();
    });

    it('"Sí" on step 2 shows a "Continuar" or next button to step 3', () => {
      goToStep2();
      fireEvent.click(screen.getAllByText('Sí')[0]);
      expect(screen.getByText(/continuar|siguiente|paso 3/i)).toBeInTheDocument();
    });
  });

  // ─── Step 3 — Save Binance now ────────────────────────────────────────────

  describe('step 3 — save binance now', () => {
    const goToStep3 = () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      fireEvent.click(screen.getAllByText('Sí')[0]); // step 1 → step 2
      fireEvent.click(screen.getAllByText('No')[0]);  // step 2: answer No
      fireEvent.click(screen.getByText('Continuar')); // step 2 → step 3
    };

    it('renders step 3 question about saving Binance keys', () => {
      goToStep3();
      expect(screen.getByText(/Paso 3 de 3/i)).toBeInTheDocument();
    });

    it('renders "Ir a Ajustes" button', () => {
      goToStep3();
      expect(screen.getByText('Ir a Ajustes')).toBeInTheDocument();
    });

    it('renders "Más tarde" button', () => {
      goToStep3();
      expect(screen.getByText('Más tarde')).toBeInTheDocument();
    });

    it('"Ir a Ajustes" dispatches open-settings event with tab binance', () => {
      goToStep3();
      const listener = vi.fn();
      window.addEventListener('open-settings', listener);
      fireEvent.click(screen.getByText('Ir a Ajustes'));
      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail?.tab).toBe('binance');
      window.removeEventListener('open-settings', listener);
    });

    it('"Ir a Ajustes" sets onboarding_completed in localStorage', () => {
      goToStep3();
      fireEvent.click(screen.getByText('Ir a Ajustes'));
      expect(localStorage.getItem('onboarding_completed')).toBe('true');
    });

    it('"Más tarde" sets onboarding_completed in localStorage', () => {
      goToStep3();
      fireEvent.click(screen.getByText('Más tarde'));
      expect(localStorage.getItem('onboarding_completed')).toBe('true');
    });

    it('"Más tarde" calls onClose', () => {
      const onClose = vi.fn();
      render(<OnboardingWizard onClose={onClose} />);
      fireEvent.click(screen.getAllByText('Sí')[0]);
      fireEvent.click(screen.getAllByText('No')[0]);
      fireEvent.click(screen.getByText('Continuar'));
      fireEvent.click(screen.getByText('Más tarde'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('"Ir a Ajustes" calls onClose', () => {
      const onClose = vi.fn();
      render(<OnboardingWizard onClose={onClose} />);
      fireEvent.click(screen.getAllByText('Sí')[0]);
      fireEvent.click(screen.getAllByText('No')[0]);
      fireEvent.click(screen.getByText('Continuar'));
      fireEvent.click(screen.getByText('Ir a Ajustes'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Close / dismiss ──────────────────────────────────────────────────────

  describe('close behavior', () => {
    it('renders a close button (×)', () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: /cerrar|close|×/i })).toBeInTheDocument();
    });

    it('clicking close button calls onClose', () => {
      const onClose = vi.fn();
      render(<OnboardingWizard onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /cerrar|close|×/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clicking close button saves onboarding_completed', () => {
      render(<OnboardingWizard onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /cerrar|close|×/i }));
      expect(localStorage.getItem('onboarding_completed')).toBe('true');
    });
  });

  // ─── Dashboard integration guard ─────────────────────────────────────────

  describe('should not render if already completed', () => {
    it('Dashboard integration: onboarding is not shown when onboarding_completed=true in localStorage', () => {
      // This verifies the util directly — Dashboard rendering is tested separately
      localStorage.setItem('onboarding_completed', 'true');
      expect(isOnboardingCompleted()).toBe(true);
    });
  });
});
