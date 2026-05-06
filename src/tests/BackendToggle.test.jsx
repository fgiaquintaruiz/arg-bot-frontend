import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config', () => ({
  getApiUrl: () => 'http://localhost:8080',
  API_URL: 'http://localhost:8080',
}));

// prevVersionRef override — null means "use real useRef" (normal path)
// Set to a string to pre-populate prevVersionRef.current for version-change detection tests
let _mockPrevVersionRef = null;

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  // NOTE: use a stable function (not vi.fn) to avoid clearAllMocks() wiping the implementation
  // Returns a REAL React ref (to avoid hook-order violations) with current pre-set when needed
  function patchedUseRef(initialValue) {
    const ref = actual.useRef(initialValue);
    if (_mockPrevVersionRef !== null && typeof initialValue === 'string') {
      ref.current = _mockPrevVersionRef; // mutate real ref — preserves fiber identity
      _mockPrevVersionRef = null; // consume after first use
    }
    return ref;
  }
  return {
    ...actual,
    useRef: patchedUseRef,
  };
});

import BackendToggle from '../components/BackendToggle';

describe('BackendToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _mockPrevVersionRef = null; // reset override — normal path for all tests by default
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: '1.0.0' }),
    });
  });

  it('renderiza la etiqueta Kotlin', () => {
    render(<BackendToggle />);
    expect(screen.getByText('Kotlin')).toBeInTheDocument();
  });

  it('muestra versión cargada tras el health check', async () => {
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  it('muestra "—" si el health check falla', async () => {
    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('network'));
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('muestra indicador online (verde) cuando el backend responde', async () => {
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
    const dot = screen.getByText('Kotlin').parentElement.querySelector('span:first-child');
    expect(dot.className).toContain('dot-online');
  });

  it('primera carga no dispara navegación aunque la versión sea nueva', async () => {
    const locationStub = { pathname: '/app', href: '/app' };
    Object.defineProperty(window, 'location', {
      value: locationStub,
      configurable: true,
      writable: true,
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
    expect(locationStub.href).toBe('/app');
  });

  // --- Branches de fetchVersion ---

  it('muestra "—" y offline cuando getApiUrl devuelve string vacío', async () => {
    // Branch: if (!url) → { version: '—', online: false }
    // Override the config mock to return empty string for this test only
    vi.doMock('../config', () => ({ getApiUrl: () => '', API_URL: '' }));
    vi.resetModules();
    const { default: BackendToggleEmpty } = await import('../components/BackendToggle?empty-url');
    render(<BackendToggleEmpty />);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
    const dot = screen.getByText('Kotlin').parentElement.querySelector('span:first-child');
    expect(dot.className).toContain('dot-offline');
    vi.doUnmock('../config');
  });

  it('muestra "—" y offline cuando el servidor responde con status no-ok (4xx/5xx)', async () => {
    // Branch: if (!res.ok) → { version: '—', online: false }
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
    const dot = screen.getByText('Kotlin').parentElement.querySelector('span:first-child');
    expect(dot.className).toContain('dot-offline');
  });

  it('extrae versión desde data.info.build.version como fallback', async () => {
    // Branch: data.version falsy → data.info?.build?.version
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ info: { build: { version: '2.0.0-info' } } }),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('2.0.0-info')).toBeInTheDocument();
    });
  });

  it('extrae versión desde data.build.version como fallback', async () => {
    // Branch: data.version falsy, data.info?.build?.version falsy → data.build?.version
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ build: { version: '3.0.0-build' } } ),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('3.0.0-build')).toBeInTheDocument();
    });
  });

  it('extrae versión desde data.app.version como fallback', async () => {
    // Branch: data.version, data.info?.build?.version, data.build?.version falsy → data.app?.version
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ app: { version: '4.0.0-app' } }),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('4.0.0-app')).toBeInTheDocument();
    });
  });

  it('extrae versión desde data.application.version como fallback', async () => {
    // Branch: todos los anteriores falsy → data.application?.version
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ application: { version: '5.0.0-application' } }),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('5.0.0-application')).toBeInTheDocument();
    });
  });

  it('muestra "—" cuando la respuesta no contiene ningún campo de versión conocido', async () => {
    // Branch: todos los campos de versión son falsy → '—'
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('muestra indicador offline (rojo) en el estado inicial antes de recibir respuesta', () => {
    // Branch: info.online = false → backgroundColor '#F6465D' (estado inicial '…')
    vi.spyOn(window, 'fetch').mockImplementation(() => new Promise(() => {})); // never resolves
    render(<BackendToggle />);
    const dot = screen.getByText('Kotlin').parentElement.querySelector('span:first-child');
    expect(dot.className).toContain('dot-offline');
  });

  // --- Branches de detección de cambio de versión (lines 33-35, 69, 72) ---

  describe('detección de cambio de versión (updating=true)', () => {
    let locationStub;

    beforeEach(() => {
      sessionStorage.clear();
      locationStub = { pathname: '/app', href: '/app' };
      Object.defineProperty(window, 'location', {
        value: locationStub,
        configurable: true,
        writable: true,
      });
    });

    it('detecta cambio de versión: muestra color amarillo (#F0B90B) cuando updating=true', async () => {
      // Branches cubiertas:
      //   Branch 3 (if line 33) → TRUE path: setUpdating(true) + setTimeout
      //   Branch 4 (binary-expr line 33) → segunda y tercera condición evaluadas
      //   Branch 6 (cond-expr line 69) → updating ? '#F0B90B' : '#848E9C' → TRUE
      //   Branch 7 (cond-expr line 72) → updating ? {animation} : {} → TRUE
      //
      // Estrategia: pre-populamos sessionStorage con '1.0.0',
      // luego fetch devuelve '2.0.0' → condición es verdadera → setUpdating(true)
      sessionStorage.setItem('argbot_last_version', '1.0.0');

      vi.spyOn(window, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      });

      render(<BackendToggle />);

      await waitFor(() => {
        expect(screen.getByText('2.0.0')).toBeInTheDocument();
      });

      // El componente debe estar en estado updating=true → clase version-updating
      const versionSpan = screen.getByText('2.0.0');
      expect(versionSpan.className).toContain('version-updating');
    });

    it('detecta cambio de versión: anima el span de versión con pulse cuando updating=true', async () => {
      // Branch 7 (cond-expr line 72) → updating ? { animation: 'pulse ...' } : {} → TRUE path
      sessionStorage.setItem('argbot_last_version', '1.0.0');

      vi.spyOn(window, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '3.0.0' }),
      });

      render(<BackendToggle />);

      await waitFor(() => {
        expect(screen.getByText('3.0.0')).toBeInTheDocument();
      });

      const versionSpan = screen.getByText('3.0.0');
      expect(versionSpan.className).toContain('version-updating');
    });

    it('NO dispara actualización cuando la versión es "—" (backend sin versión, mismo prevRef)', async () => {
      // Branch 4 (binary-expr line 33) → segunda condición result.version !== '—' es FALSE → short-circuit
      // Esto cubre el caso donde sessionStorage tiene valor pero la nueva versión es '—'
      sessionStorage.setItem('argbot_last_version', '1.0.0');

      vi.spyOn(window, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }), // no version fields → returns '—'
      });

      render(<BackendToggle />);

      await waitFor(() => {
        expect(screen.getByText('—')).toBeInTheDocument();
      });

      // updating NO debe ser true → clase version-idle
      const versionSpan = screen.getByText('—');
      expect(versionSpan.className).toContain('version-idle');
    });

    it('NO dispara actualización cuando la versión no cambió (misma versión en sessionStorage)', async () => {
      // Branch 4 (binary-expr line 33) → tercera condición prev !== result.version es FALSE
      const sameVersion = '1.0.0';
      sessionStorage.setItem('argbot_last_version', sameVersion);

      vi.spyOn(window, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: sameVersion }),
      });

      render(<BackendToggle />);

      await waitFor(() => {
        expect(screen.getByText(sameVersion)).toBeInTheDocument();
      });

      // updating NO debe ser true → clase version-idle (versión no cambió)
      const versionSpan = screen.getByText(sameVersion);
      expect(versionSpan.className).toContain('version-idle');
    });
  });
});
