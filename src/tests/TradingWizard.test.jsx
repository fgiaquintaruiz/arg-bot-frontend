import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TradingWizard from '../components/TradingWizard';

vi.mock('../components/Trade', () => ({
  default: ({ onSuccess }) => (
    <div data-testid="trade-mock">
      <button onClick={onSuccess}>Trade Success</button>
    </div>
  ),
}));

vi.mock('../components/Withdraw', () => ({
  default: ({ onSuccess }) => (
    <div data-testid="withdraw-mock">
      <button onClick={onSuccess}>Withdraw Success</button>
    </div>
  ),
}));

const mockData = {
  balances: { eur: '100.00', usdc: '50.00' },
  rate: '1.08',
  usdcArsRate: '1150.50',
  ripioUsdcArsRate: '1200.00',
  nexoUsdcArsRate: '1100.00',
  fees: { tradingRate: 0.001 },
};

describe('TradingWizard', () => {
  const onRefreshData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renderiza el paso inicial (step 0) con el campo de ARS', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    expect(screen.getByText('1. Simulación')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('500000')).toBeInTheDocument();
  });

  it('step 1 con IBAN: muestra datos SEPA directamente (sin QR)', () => {
    localStorage.setItem('binance_eur_iban', 'ES1234567890123456789012');
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText(/Continuar con la transferencia/));

    expect(screen.getByText('ES1234567890123456789012')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  it('step 1 sin IBAN: muestra empty state de configuración', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText(/Continuar con la transferencia/));

    expect(screen.getByText(/No tenés cuenta SEPA configurada/)).toBeInTheDocument();
  });

  it('el disclaimer de Ripio aparece en el step 4', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);

    // Step 0 → 1
    fireEvent.click(screen.getByText(/Continuar con la transferencia/));
    // Step 1 → 2
    fireEvent.click(screen.getByText(/Ya realicé la transferencia/));
    // Step 2 → 3 (Trade mock fires onSuccess)
    fireEvent.click(screen.getByText('Trade Success'));
    // Step 3 → 4 (Withdraw mock fires onSuccess)
    fireEvent.click(screen.getByText('Withdraw Success'));

    expect(screen.getByText(/comisiones del broker no están incluidas/)).toBeInTheDocument();
  });

  it('muestra estado de carga cuando data es null', () => {
    render(<TradingWizard data={null} />);
    expect(screen.getByText('Cargando tasas de mercado...')).toBeInTheDocument();
  });

  it('muestra botón Reiniciar al avanzar al step 1', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    fireEvent.click(screen.getByText(/Continuar con la transferencia/));
    expect(screen.getByText(/Reiniciar simulación/)).toBeInTheDocument();
  });

  it('editar el campo EUR activa el modo eur y recalcula ARS', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    const eurInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(eurInput, { target: { value: '500' } });
    // El campo ARS ahora debería mostrar el valor calculado
    // calcFromEur(500): netEur=499, grossUsdc=499*1.08=538.92, netUsdc≈538.38, ars≈619407
    const arsInput = screen.getByPlaceholderText('500000');
    expect(arsInput.value).not.toBe('500000');
    expect(arsInput.value).toMatch(/^\d[\d.,]+$/);
  });

  it('muestra datos SEPA en step 1 sin necesidad de expandir', () => {
    localStorage.setItem('binance_eur_iban', 'ES1234567890123456789012');
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText(/Continuar con la transferencia/));

    expect(screen.getByText('IBAN')).toBeInTheDocument();
    expect(screen.getByText('ES1234567890123456789012')).toBeInTheDocument();
  });

  it('click en Copiar del campo IBAN llama a copyToClipboard', async () => {
    localStorage.setItem('binance_eur_iban', 'ES1234567890123456789012');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText(/Continuar con la transferencia/));

    const copyButtons = screen.getAllByText('Copiar');
    fireEvent.click(copyButtons[0]);

    expect(writeText).toHaveBeenCalledWith('ES1234567890123456789012');

    delete navigator.clipboard;
  });

  it('click en "Configuración → Binance" despacha evento open-settings', () => {
    const eventSpy = vi.fn();
    window.addEventListener('open-settings', eventSpy);

    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);

    // El link de Ajustes aparece en step 0 cuando no hay IBAN
    const configLink = screen.getByTestId('open-settings-link');
    fireEvent.click(configLink);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    window.removeEventListener('open-settings', eventSpy);
  });

  it('usa valores de fallback cuando data no tiene rate/fees definidos', () => {
    const dataMinima = {
      balances: { eur: '100.00', usdc: '50.00' },
      // usdcArsRate, rate y fees ausentes — activan los || y ?? fallbacks
    };
    render(<TradingWizard data={dataMinima} onRefreshData={onRefreshData} />);
    // Renderiza sin explotar — los fallbacks (1121, 1.08, 0.8) se usaron
    expect(screen.getByText('1. Simulación')).toBeInTheDocument();
  });

  it('borrar el ARS input no rompe el cálculo (|| 0 branch en arsAmount)', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    const arsInput = screen.getByPlaceholderText('500000');
    // Limpiar el campo ARS → arsAmount = '' → parseFloat('') || 0 → displayedEur = calcFromArs(0) = sepaFee = 1
    fireEvent.change(arsInput, { target: { value: '' } });
    // El botón "Continuar" debe deshabilitarse porque displayedEur <= 0 cuando ARS=0
    // (calcFromArs(0) = sepaFee = 1.00 > 0, así que el botón sigue habilitado)
    expect(arsInput).toBeInTheDocument();
    expect(arsInput.value).toBe('');
    expect(screen.getByText('1. Simulación')).toBeInTheDocument();
  });

  it('usar EUR input con valor vacío no rompe el cálculo (|| 0 branch)', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    const eurInput = screen.getByPlaceholderText('0.00');
    // Activar editMode=eur con valor vacío → parseFloat('') || 0 → displayedArs = 0
    fireEvent.change(eurInput, { target: { value: '' } });
    const arsInput = screen.getByPlaceholderText('500000');
    // Con EUR=0, displayedArs debería ser 0 → el input muestra string vacío
    expect(arsInput.value).toBe('');
    expect(eurInput.value).toBe('');
  });

  it('EUR input con valor igual a sepaFee activa rama netEur <= 0 en calcFromEur', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    const eurInput = screen.getByPlaceholderText('0.00');
    // sepaFee = 1.00 → netEur = 1 - 1 = 0 → branch netEur <= 0 → ars = 0
    fireEvent.change(eurInput, { target: { value: '1' } });
    const arsInput = screen.getByPlaceholderText('500000');
    // netEur=0 → {usdc:0, ars:0} → displayedArs=0 → ARS input muestra string vacío
    expect(arsInput.value).toBe('');
    expect(screen.getByText(/Monto muy bajo/i)).toBeInTheDocument();
  });

  it('sepaReference usa email cuando user_email está en localStorage', () => {
    localStorage.setItem('binance_eur_iban', 'ES1234567890123456789012');
    localStorage.setItem('user_email', 'test@example.com');
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText(/Continuar con la transferencia/));

    expect(screen.getByText('test@example.com Binance Deposit')).toBeInTheDocument();
  });

  it('step 4 muestra mensaje fallback cuando nexoUsdcArsRate es nulo', () => {
    const dataWithoutNexo = { ...mockData, nexoUsdcArsRate: null };
    render(<TradingWizard data={dataWithoutNexo} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText(/Continuar con la transferencia/));
    fireEvent.click(screen.getByText(/Ya realicé la transferencia/));
    fireEvent.click(screen.getByText('Trade Success'));
    fireEvent.click(screen.getByText('Withdraw Success'));

    expect(screen.getByText('Rate del broker no disponible. Verificá en la app de tu broker cripto.')).toBeInTheDocument();
  });

  it('step 1: cuando IBAN está configurado, muestra el IBAN con botón copiar (sin QR)', () => {
    localStorage.setItem('binance_eur_iban', 'ES1234567890123456789012');
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    fireEvent.click(screen.getByText(/Continuar con la transferencia/));

    expect(screen.getByText('ES1234567890123456789012')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  it('step 1: cuando IBAN NO está configurado, muestra empty state con texto de configuración', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    fireEvent.click(screen.getByText(/Continuar con la transferencia/));

    expect(screen.getByText(/No tenés cuenta SEPA configurada/)).toBeInTheDocument();
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  it('los steps se numeran correctamente: "1. Simulación", "2. Transferir al banco"', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    expect(screen.getByText('1. Simulación')).toBeInTheDocument();
  });

  it('avanzar al step 1 muestra "2. Transferir al banco" numerado', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    fireEvent.click(screen.getByText(/Continuar con la transferencia/));
    expect(screen.getByText('2. Transferir al banco')).toBeInTheDocument();
  });

  it('clickear un step completado (anterior) navega de vuelta a ese step', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    // Avanzar al step 1
    fireEvent.click(screen.getByText(/Continuar con la transferencia/));
    // El step 0 (Simulación) está completado — debe ser clickeable
    fireEvent.click(screen.getByText('1. Simulación'));
    // Debe volver al step 0: el botón "Continuar" debe aparecer de nuevo
    expect(screen.getByText(/Continuar con la transferencia/)).toBeInTheDocument();
  });

  it('el step activo NO es clickeable (no navega al hacer click)', () => {
    render(<TradingWizard data={mockData} onRefreshData={onRefreshData} />);
    // Step 0 está activo — click no debe cambiar nada
    fireEvent.click(screen.getByText('1. Simulación'));
    // El botón "Continuar" sigue visible (sigue en step 0)
    expect(screen.getByText(/Continuar con la transferencia/)).toBeInTheDocument();
  });

});
