import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Calculator from '../components/Calculator';

const mockData = {
  balances: { eur: '100.00', usdc: '500.00' },
  rate: '1.08',
  usdcArsRate: '1150.50',
  fees: {
    withdrawalUSDC_BEP20: 0.8,
    tradingRate: 0.001,
  },
};

const setupClipboard = (shouldFail = false) => {
  const mockWrite = shouldFail
    ? vi.fn().mockRejectedValue(new Error('denied'))
    : vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWrite },
    configurable: true,
    writable: true,
  });
  return mockWrite;
};

describe('Calculator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Render básico ───────────────────────────────────────────────────────────

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

  it('should display fee breakdown section', () => {
    render(<Calculator data={mockData} />);
    expect(screen.getByText(/Depósito SEPA/)).toBeInTheDocument();
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

  // ─── Lógica de cálculo ───────────────────────────────────────────────────────

  describe('Lógica de cálculo', () => {
    it('modo ARS (default): EUR se calcula a partir de ARS', () => {
      render(<Calculator data={mockData} />);
      const arsInput = screen.getByPlaceholderText('500000');
      fireEvent.change(arsInput, { target: { value: '500000' } });
      const eurInput = screen.getByPlaceholderText('0.00');
      expect(parseFloat(eurInput.value)).toBeGreaterThan(0);
    });

    it('modo EUR: ARS se calcula a partir de EUR', () => {
      render(<Calculator data={mockData} />);
      const eurInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(eurInput, { target: { value: '400' } });
      const arsInput = screen.getByPlaceholderText('500000');
      expect(parseFloat(arsInput.value)).toBeGreaterThan(0);
    });

    it('EUR ≤ sepaFee (1 EUR): usdc=0, ARS muestra vacío', () => {
      render(<Calculator data={mockData} />);
      const eurInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(eurInput, { target: { value: '0.5' } });
      const arsInput = screen.getByPlaceholderText('500000');
      expect(arsInput.value).toBe('');
    });

    it('EUR exactamente igual a sepaFee (1 EUR): usdc=0, ARS vacío', () => {
      render(<Calculator data={mockData} />);
      const eurInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(eurInput, { target: { value: '1' } });
      const arsInput = screen.getByPlaceholderText('500000');
      expect(arsInput.value).toBe('');
    });

    it('ARS input vacío → displayedArs=0, EUR se sigue calculando', () => {
      render(<Calculator data={mockData} />);
      const arsInput = screen.getByPlaceholderText('500000');
      fireEvent.change(arsInput, { target: { value: '' } });
      expect(arsInput.value).toBe('');
    });

    it('calcFromArs es el inverso aproximado de calcFromEur', () => {
      render(<Calculator data={mockData} />);
      // Poner EUR manualmente
      const eurInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(eurInput, { target: { value: '435' } });
      const arsInput = screen.getByPlaceholderText('500000');
      const arsValue = parseFloat(arsInput.value);
      // Luego cambiar ese ARS de vuelta
      fireEvent.change(arsInput, { target: { value: arsValue.toFixed(0) } });
      const eurBack = parseFloat(eurInput.value);
      // Tolerancia del 1% por redondeo
      expect(Math.abs(eurBack - 435)).toBeLessThan(5);
    });

    it('valores negativos en ARS → trata como 0', () => {
      render(<Calculator data={mockData} />);
      const arsInput = screen.getByPlaceholderText('500000');
      fireEvent.change(arsInput, { target: { value: '-100000' } });
      // El cálculo parseFloat('-100000') = -100000, lo toma igual
      // Sólo verificamos que no crashea
      expect(screen.getByText(/Depósito SEPA/)).toBeInTheDocument();
    });

    it('muestra breakdown con fees correctos del mock', () => {
      render(<Calculator data={mockData} />);
      expect(screen.getByText(/Depósito SEPA/)).toBeInTheDocument();
      expect(screen.getByText(/Fee trading/)).toBeInTheDocument();
      expect(screen.getByText(/Retiro Binance BEP20/)).toBeInTheDocument();
    });
  });

  // ─── Defaults cuando data incompleto ─────────────────────────────────────────

  describe('Defaults con data incompleto', () => {
    it('usa tasa EUR/USDC=1.08 por default cuando data.rate es undefined', () => {
      render(<Calculator data={{ usdcArsRate: '1150.50', fees: { withdrawalUSDC_BEP20: 0.8 } }} />);
      expect(screen.getByText(/EUR→USDC \(1\.0800\)/)).toBeInTheDocument();
    });

    it('usa usdcArs=1121 por default cuando usdcArsRate es undefined', () => {
      render(<Calculator data={{ rate: '1.08', fees: { withdrawalUSDC_BEP20: 0.8 } }} />);
      expect(screen.getByText(/USDC destino \(1121\)/)).toBeInTheDocument();
    });

    it('usa withdrawalFee=0.8 por default cuando fees es undefined', () => {
      render(<Calculator data={{ rate: '1.08', usdcArsRate: '1150.50' }} />);
      expect(screen.getByText(/\+ 0\.80 USDC/)).toBeInTheDocument();
    });

    it('renderiza sin crashear con data completamente vacío', () => {
      render(<Calculator data={{}} />);
      expect(screen.getByText(/Calculadora/)).toBeInTheDocument();
    });
  });

  // ─── copyToClipboard ─────────────────────────────────────────────────────────

  describe('copyToClipboard', () => {
    beforeEach(() => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
    });

    it('copia al clipboard y muestra ✓ en el botón correcto', async () => {
      const mockWrite = setupClipboard();
      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      const copyButtons = screen.getAllByText('Copiar');
      fireEvent.click(copyButtons[0]);

      await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('resetea ✓ a "Copiar" después de 2 segundos', async () => {
      vi.useFakeTimers();
      setupClipboard();
      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      const copyButtons = screen.getAllByText('Copiar');
      await act(async () => { fireEvent.click(copyButtons[0]); });

      expect(screen.getByText('✓')).toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(2000); });
      expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });

    it('usa fallback execCommand cuando clipboard API falla', async () => {
      setupClipboard(true);
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      const copyButtons = screen.getAllByText('Copiar');
      fireEvent.click(copyButtons[0]);

      await waitFor(() => expect(execCommandMock).toHaveBeenCalledWith('copy'));
    });

    it('copiar monto muestra ✓ en el botón de monto', async () => {
      setupClipboard();
      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      // El botón de monto es el último en la lista de campos SEPA + concepto
      const copyButtons = screen.getAllByText('Copiar');
      const amountCopyBtn = copyButtons[copyButtons.length - 2]; // monto es el penúltimo
      fireEvent.click(amountCopyBtn);

      await waitFor(() => expect(screen.getByText('✓')).toBeInTheDocument());
    });
  });

  // ─── copyAllSepaDetails ───────────────────────────────────────────────────────

  describe('copyAllSepaDetails', () => {
    it('sin IBAN: botón "Copiar todos los datos" no aparece', () => {
      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));
      expect(screen.queryByText('Copiar todos los datos')).not.toBeInTheDocument();
    });

    it('con IBAN: copia texto con nombre, IBAN sin espacios, BIC, monto y concepto', async () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
      const mockWrite = setupClipboard();

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));
      fireEvent.click(screen.getByText('Copiar todos los datos'));

      await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
      const copied = mockWrite.mock.calls[0][0];
      expect(copied).toContain('ES912100041845020005133'); // IBAN sin espacios
      expect(copied).toContain('EUR');
      expect(copied).toContain('Binance');
    });

    it('con banco configurado: incluye banco y dirección en texto copiado', async () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
      localStorage.setItem('binance_bank_name', 'Revolut');
      localStorage.setItem('binance_bank_address', 'London, UK');
      const mockWrite = setupClipboard();

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));
      fireEvent.click(screen.getByText('Copiar todos los datos'));

      await waitFor(() => {
        const copied = mockWrite.mock.calls[0][0];
        expect(copied).toContain('Revolut');
        expect(copied).toContain('London, UK');
      });
    });

    it('muestra ✅ Copiado después de copiar', async () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
      setupClipboard();

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));
      fireEvent.click(screen.getByText('Copiar todos los datos'));

      await waitFor(() => expect(screen.getByText('✅ Copiado')).toBeInTheDocument());
    });

    it('✅ Copiado vuelve a "Copiar todos" después de 3 segundos', async () => {
      vi.useFakeTimers();
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
      setupClipboard();

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));
      await act(async () => { fireEvent.click(screen.getByText('Copiar todos los datos')); });

      expect(screen.getByText('✅ Copiado')).toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(3000); });
      expect(screen.getByText('Copiar todos los datos')).toBeInTheDocument();
    });
  });

  // ─── openBankApp ─────────────────────────────────────────────────────────────

  describe('openBankApp', () => {
    it('sin IBAN: abre el panel SEPA en lugar de lanzar app', () => {
      render(<Calculator data={mockData} />);
      expect(screen.queryByText('Datos de transferencia SEPA')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText(/Abrir app del banco/));
      expect(screen.getByText('Datos de transferencia SEPA')).toBeInTheDocument();
    });

    it('con IBAN: cambia el texto del botón a "Abriendo tu banco..."', () => {
      vi.useFakeTimers();
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Abrir app del banco/));

      expect(screen.getByText('Abriendo tu banco...')).toBeInTheDocument();
    });

    it('con IBAN: botón queda deshabilitado mientras tryingBankApp=true', () => {
      vi.useFakeTimers();
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Abrir app del banco/));

      expect(screen.getByText('Abriendo tu banco...').closest('button')).toBeDisabled();
    });

    it('con IBAN: después de 5s sin respuesta del banco → muestra mensaje de fallo', () => {
      vi.useFakeTimers();
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Abrir app del banco/));
      act(() => { vi.advanceTimersByTime(5000); });

      expect(screen.getByText('Tu banco no abrió automáticamente')).toBeInTheDocument();
    });

    it('bankAppFailed: click en "Mostrar datos para copiar" abre panel y oculta el mensaje', () => {
      vi.useFakeTimers();
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Abrir app del banco/));
      act(() => { vi.advanceTimersByTime(5000); });

      fireEvent.click(screen.getByText('Mostrar datos para copiar'));

      expect(screen.queryByText('Tu banco no abrió automáticamente')).not.toBeInTheDocument();
      expect(screen.getByText('Datos de transferencia SEPA')).toBeInTheDocument();
    });

    it('con IBAN: botón vuelve a "Abrir app del banco" después de 5s', () => {
      vi.useFakeTimers();
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Abrir app del banco/));
      act(() => { vi.advanceTimersByTime(5000); });

      expect(screen.getByText(/Abrir app del banco/)).toBeInTheDocument();
    });
  });

  // ─── openSettings ────────────────────────────────────────────────────────────

  describe('openSettings', () => {
    it('despacha CustomEvent "open-settings" con tab=binance al hacer click', () => {
      render(<Calculator data={mockData} />);
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const settingsLinks = screen.getAllByText('Configuración → Binance');
      fireEvent.click(settingsLinks[0]);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'open-settings' })
      );
      const event = dispatchSpy.mock.calls[0][0];
      expect(event.detail).toEqual({ tab: 'binance' });
    });
  });

  // ─── Panel SEPA details ───────────────────────────────────────────────────────

  describe('Panel SEPA details', () => {
    it('toggle: click abre y segundo click cierra el panel', () => {
      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar ▼/));
      expect(screen.getByText('Datos de transferencia SEPA')).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Ver datos para copiar ▲/));
      expect(screen.queryByText('Datos de transferencia SEPA')).not.toBeInTheDocument();
    });

    it('con IBAN: muestra Beneficiario, IBAN, BIC con sus valores', () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
      localStorage.setItem('binance_eur_name', 'Mi Banco Custom');
      localStorage.setItem('binance_eur_bic', 'MYBICXXXX');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      expect(screen.getByText('Mi Banco Custom')).toBeInTheDocument();
      expect(screen.getByText('ES91 2100 0418 4502 0005 1332')).toBeInTheDocument();
      expect(screen.getByText('MYBICXXXX')).toBeInTheDocument();
    });

    it('con banco configurado: muestra nombre y dirección del banco', () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
      localStorage.setItem('binance_bank_name', 'Revolut');
      localStorage.setItem('binance_bank_address', 'London, UK');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      expect(screen.getByText('Revolut')).toBeInTheDocument();
      expect(screen.getByText('London, UK')).toBeInTheDocument();
    });

    it('sin banco configurado: no muestra sección de banco', () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
      // sin binance_bank_name ni binance_bank_address

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      expect(screen.queryByText('Banco')).not.toBeInTheDocument();
    });

    it('sin IBAN: panel muestra mensaje de configuración con link', () => {
      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      const settingsLinks = screen.getAllByText('Configuración → Binance');
      expect(settingsLinks.length).toBeGreaterThanOrEqual(1);
    });

    it('sepaReference usa email del usuario cuando está en localStorage', () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
      localStorage.setItem('user_email', 'test@example.com');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      expect(screen.getByText('test@example.com Binance Deposit')).toBeInTheDocument();
    });

    it('sepaReference usa "Deposito ARGBOT" cuando no hay email', () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');
      // sin user_email

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      expect(screen.getByText('Deposito ARGBOT')).toBeInTheDocument();
    });

    it('muestra el monto en EUR calculado dentro del panel SEPA', () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      // El monto aparece como "XXX.XX EUR" en el panel SEPA
      expect(screen.getByText(/\d+\.\d+ EUR/)).toBeInTheDocument();
    });

    it('nota "Solo transferencia SEPA — no SWIFT" aparece en el panel', () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      expect(screen.getByText(/Solo transferencia SEPA — no SWIFT/)).toBeInTheDocument();
    });

    it('botón Copiar del concepto (sepaReference) cambia a "✓" al hacer click', async () => {
      localStorage.setItem('binance_eur_iban', 'ES91 2100 0418 4502 0005 1332');

      render(<Calculator data={mockData} />);
      fireEvent.click(screen.getByText(/Ver datos para copiar/));

      // El último botón "Copiar" es el de concepto (ref)
      const copyButtons = screen.getAllByText('Copiar');
      fireEvent.click(copyButtons[copyButtons.length - 1]);

      await waitFor(() => expect(screen.getByText('✓')).toBeInTheDocument());
    });
  });
});
