import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TradingWizard from '../components/TradingWizard';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr-code" data-value={value} />,
}));

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
  fees: { withdrawalUSDC_BEP20: 0.8, tradingRate: 0.001 },
};

describe('TradingWizard', () => {
  const onBack = vi.fn();
  const onRefreshData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renderiza el paso inicial (step 0) con el campo de ARS', () => {
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);
    expect(screen.getByText('Simulación')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('500000')).toBeInTheDocument();
  });

  it('muestra QR EPC cuando hay IBAN en localStorage', () => {
    localStorage.setItem('binance_eur_iban', 'ES1234567890123456789012');
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText('Continuar con la transferencia →'));

    const qr = screen.getByTestId('qr-code');
    expect(qr).toBeInTheDocument();
    expect(qr.getAttribute('data-value')).toContain('ES1234567890123456789012');
    expect(qr.getAttribute('data-value')).toContain('SCT');
  });

  it('muestra advertencia de configuración cuando NO hay IBAN', () => {
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText('Continuar con la transferencia →'));

    expect(
      screen.getByText('Configurá tu IBAN de Binance en Ajustes para ver el QR de pago.')
    ).toBeInTheDocument();
  });

  it('el disclaimer de Ripio aparece en el step 4', () => {
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);

    // Step 0 → 1
    fireEvent.click(screen.getByText('Continuar con la transferencia →'));
    // Step 1 → 2
    fireEvent.click(screen.getByText('Ya realicé la transferencia →'));
    // Step 2 → 3 (Trade mock fires onSuccess)
    fireEvent.click(screen.getByText('Trade Success'));
    // Step 3 → 4 (Withdraw mock fires onSuccess)
    fireEvent.click(screen.getByText('Withdraw Success'));

    expect(screen.getByText(/comisiones de Ripio no están incluidas/)).toBeInTheDocument();
  });

  it('muestra estado de carga cuando data es null', () => {
    render(<TradingWizard data={null} />);
    expect(screen.getByText('Cargando tasas de mercado...')).toBeInTheDocument();
  });

  it('el botón onBack llama a la función proporcionada', () => {
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);
    fireEvent.click(screen.getByRole('button', { name: /Volver al menú/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('editar el campo EUR activa el modo eur y recalcula ARS', () => {
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);
    const eurInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(eurInput, { target: { value: '500' } });
    // El campo ARS ahora debería mostrar el valor calculado
    const arsInput = screen.getByPlaceholderText('500000');
    expect(arsInput.value).not.toBe('500000');
  });

  it('muestra datos SEPA al expandir "Ver datos para copiar" en step 1', async () => {
    localStorage.setItem('binance_eur_iban', 'ES1234567890123456789012');
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText('Continuar con la transferencia →'));
    fireEvent.click(screen.getByText('Ver datos para copiar'));

    expect(screen.getByText('Beneficiario')).toBeInTheDocument();
    expect(screen.getByText('IBAN')).toBeInTheDocument();
  });

  it('click en Copiar del campo IBAN llama a copyToClipboard', async () => {
    localStorage.setItem('binance_eur_iban', 'ES1234567890123456789012');
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText('Continuar con la transferencia →'));
    fireEvent.click(screen.getByText('Ver datos para copiar'));

    const copyButtons = screen.getAllByText('Copiar');
    fireEvent.click(copyButtons[0]);

    // No lanza excepción — copyToClipboard ejecutado
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('click en "Configuración → Binance" despacha evento open-settings', () => {
    const eventSpy = vi.fn();
    window.addEventListener('open-settings', eventSpy);

    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);

    // El link de Ajustes aparece en step 0 cuando no hay IBAN
    fireEvent.click(screen.getByText('Configuración → Binance'));

    expect(eventSpy).toHaveBeenCalledTimes(1);
    window.removeEventListener('open-settings', eventSpy);
  });

  it('usa valores de fallback cuando data no tiene rate/fees definidos', () => {
    const dataMinima = {
      balances: { eur: '100.00', usdc: '50.00' },
      // usdcArsRate, rate y fees ausentes — activan los || y ?? fallbacks
    };
    render(<TradingWizard data={dataMinima} onBack={onBack} onRefreshData={onRefreshData} />);
    // Renderiza sin explotar — los fallbacks (1121, 1.08, 0.8) se usaron
    expect(screen.getByText('Simulación')).toBeInTheDocument();
  });

  it('borrar el ARS input no rompe el cálculo (|| 0 branch en arsAmount)', () => {
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);
    const arsInput = screen.getByPlaceholderText('500000');
    // Limpiar el campo ARS → arsAmount = '' → parseFloat('') || 0
    fireEvent.change(arsInput, { target: { value: '' } });
    // El componente renderiza sin explotar — la rama || 0 fue ejecutada
    expect(arsInput).toBeInTheDocument();
    expect(screen.getByText('Simulación')).toBeInTheDocument();
  });

  it('usar EUR input con valor vacío no rompe el cálculo (|| 0 branch)', () => {
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);
    const eurInput = screen.getByPlaceholderText('0.00');
    // Activar editMode=eur con valor vacío → parseFloat('') || 0
    fireEvent.change(eurInput, { target: { value: '' } });
    expect(screen.getByPlaceholderText('500000')).toBeInTheDocument();
  });

  it('EUR input con valor igual a sepaFee activa rama netEur <= 0 en calcFromEur', () => {
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);
    const eurInput = screen.getByPlaceholderText('0.00');
    // sepaFee = 1.00 → netEur = 1 - 1 = 0 → branch netEur <= 0
    fireEvent.change(eurInput, { target: { value: '1' } });
    expect(screen.getByPlaceholderText('500000')).toBeInTheDocument();
  });

  it('sepaReference usa email cuando user_email está en localStorage', () => {
    localStorage.setItem('binance_eur_iban', 'ES1234567890123456789012');
    localStorage.setItem('user_email', 'test@example.com');
    render(<TradingWizard data={mockData} onBack={onBack} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText('Continuar con la transferencia →'));

    const qr = screen.getByTestId('qr-code');
    expect(qr.getAttribute('data-value')).toContain('test@example.com');
  });

  it('step 4 muestra mensaje fallback cuando ripioUsdcArsRate es nulo', () => {
    const dataWithoutRipio = { ...mockData, ripioUsdcArsRate: null };
    render(<TradingWizard data={dataWithoutRipio} onBack={onBack} onRefreshData={onRefreshData} />);

    fireEvent.click(screen.getByText('Continuar con la transferencia →'));
    fireEvent.click(screen.getByText('Ya realicé la transferencia →'));
    fireEvent.click(screen.getByText('Trade Success'));
    fireEvent.click(screen.getByText('Withdraw Success'));

    expect(screen.getByText('Rate de Ripio no disponible. Verificá en la app de Ripio.')).toBeInTheDocument();
  });
});
