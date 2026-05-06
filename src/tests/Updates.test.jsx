import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Updates from '../components/Updates';

// Mock the raw CHANGELOG.md import
vi.mock('../../CHANGELOG.md?raw', () => ({ default: '# Frontend Changelog\n\n## v1.0.0\n- Initial release\n' }));

// Mock the config module so fetch uses a predictable base URL
vi.mock('../config', () => ({ API_URL: 'http://localhost:10001' }));

describe('Updates', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('renderiza el header y el botón de cerrar', () => {
        render(<Updates onClose={onClose} />);
        expect(screen.getByText('Novedades y Hoja de Ruta')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cerrar novedades/i })).toBeInTheDocument();
    });

    it('muestra las tres pestañas', () => {
        render(<Updates onClose={onClose} />);
        expect(screen.getByText('Hoja de Ruta')).toBeInTheDocument();
        expect(screen.getByText('Frontend')).toBeInTheDocument();
        expect(screen.getByText('Backend')).toBeInTheDocument();
    });

    it('renderiza el contenido de Hoja de Ruta por defecto', () => {
        render(<Updates onClose={onClose} />);
        expect(screen.getByText(/Hoja de Ruta de ARGBOT/i)).toBeInTheDocument();
    });

    it('al hacer clic en cerrar llama a onClose', () => {
        render(<Updates onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /cerrar novedades/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('cambia al tab Frontend y muestra el changelog del front', () => {
        render(<Updates onClose={onClose} />);
        fireEvent.click(screen.getByText('Frontend'));
        expect(screen.getByText(/Frontend Changelog/i)).toBeInTheDocument();
    });

    it('cambia al tab Backend y muestra el estado de carga inicial', async () => {
        global.fetch = vi.fn(() => new Promise(() => {})); // never resolves → stays loading
        render(<Updates onClose={onClose} />);
        fireEvent.click(screen.getByText('Backend'));
        expect(screen.getByText('Cargando changelog del servidor...')).toBeInTheDocument();
    });

    it('cambia al tab Backend y carga el changelog del servidor correctamente', async () => {
        const backendContent = '# Backend Changelog\n\n## v2.0.0\n- Backend release\n';
        global.fetch = vi.fn(() =>
            Promise.resolve({ text: () => Promise.resolve(backendContent) })
        );

        render(<Updates onClose={onClose} />);
        fireEvent.click(screen.getByText('Backend'));

        await waitFor(() => {
            expect(screen.getByText(/Backend Changelog/i)).toBeInTheDocument();
        });
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/changelog'));
    });

    it('muestra error cuando falla el fetch del backend', async () => {
        global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

        render(<Updates onClose={onClose} />);
        fireEvent.click(screen.getByText('Backend'));

        await waitFor(() => {
            expect(screen.getByText('Error al cargar el historial del servidor.')).toBeInTheDocument();
        });
    });

    it('NO vuelve a hacer fetch si ya se cargó el backend y se cambia de tab', async () => {
        const backendContent = '# Backend Changelog\n';
        global.fetch = vi.fn(() =>
            Promise.resolve({ text: () => Promise.resolve(backendContent) })
        );

        render(<Updates onClose={onClose} />);
        fireEvent.click(screen.getByText('Backend'));

        await waitFor(() => {
            expect(screen.getByText(/Backend Changelog/i)).toBeInTheDocument();
        });

        // Switch away and back — fetch should NOT be called again (content already in state)
        fireEvent.click(screen.getByText('Hoja de Ruta'));
        fireEvent.click(screen.getByText('Backend'));

        // The caching guard (backendLoaded) prevents a second fetch
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});
