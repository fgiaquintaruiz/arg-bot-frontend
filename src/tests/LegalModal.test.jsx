import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LegalModal from '../components/LegalModal';

describe('LegalModal', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renderiza sin errores cuando está abierto', () => {
        render(<LegalModal onClose={onClose} />);
        expect(screen.getByText('Documentación Legal')).toBeInTheDocument();
    });

    it('muestra el botón de cerrar con aria-label correcto', () => {
        render(<LegalModal onClose={onClose} />);
        expect(screen.getByRole('button', { name: /cerrar modal legal/i })).toBeInTheDocument();
    });

    it('llama a onClose al hacer clic en el botón de cerrar', () => {
        render(<LegalModal onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /cerrar modal legal/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('muestra las dos pestañas de navegación', () => {
        render(<LegalModal onClose={onClose} />);
        expect(screen.getByText('Términos y Condiciones')).toBeInTheDocument();
        expect(screen.getByText('Políticas de Privacidad')).toBeInTheDocument();
    });

    it('muestra el contenido de Términos y Condiciones por defecto', () => {
        render(<LegalModal onClose={onClose} />);
        expect(screen.getByText(/Términos y Condiciones de Uso - ARGBOT/i)).toBeInTheDocument();
    });

    it('cambia al tab de Políticas de Privacidad al hacer clic', () => {
        render(<LegalModal onClose={onClose} />);
        fireEvent.click(screen.getByText('Políticas de Privacidad'));
        expect(screen.getByText(/Políticas de Privacidad - ARGBOT/i)).toBeInTheDocument();
    });

    it('deja de mostrar los Términos al cambiar al tab de Privacidad', () => {
        render(<LegalModal onClose={onClose} />);
        fireEvent.click(screen.getByText('Políticas de Privacidad'));
        expect(screen.queryByText(/Términos y Condiciones de Uso - ARGBOT/i)).not.toBeInTheDocument();
    });

    it('acepta initialTab="privacy" y muestra Políticas de Privacidad directamente', () => {
        render(<LegalModal onClose={onClose} initialTab="privacy" />);
        expect(screen.getByText(/Políticas de Privacidad - ARGBOT/i)).toBeInTheDocument();
        expect(screen.queryByText(/Términos y Condiciones de Uso - ARGBOT/i)).not.toBeInTheDocument();
    });

    it('acepta initialTab="terms" y muestra Términos y Condiciones directamente', () => {
        render(<LegalModal onClose={onClose} initialTab="terms" />);
        expect(screen.getByText(/Términos y Condiciones de Uso - ARGBOT/i)).toBeInTheDocument();
    });

    it('puede volver al tab de Términos tras haber cambiado a Privacidad', () => {
        render(<LegalModal onClose={onClose} />);
        fireEvent.click(screen.getByText('Políticas de Privacidad'));
        fireEvent.click(screen.getByText('Términos y Condiciones'));
        expect(screen.getByText(/Términos y Condiciones de Uso - ARGBOT/i)).toBeInTheDocument();
    });

    it('muestra contenido relevante de los Términos', () => {
        render(<LegalModal onClose={onClose} />);
        expect(screen.getByText(/Non-Custodial/i)).toBeInTheDocument();
    });

    it('muestra contenido relevante de Privacidad al cambiar de tab', () => {
        render(<LegalModal onClose={onClose} />);
        fireEvent.click(screen.getByText('Políticas de Privacidad'));
        expect(screen.getByText(/Compromiso de Privacidad/i)).toBeInTheDocument();
    });
});
