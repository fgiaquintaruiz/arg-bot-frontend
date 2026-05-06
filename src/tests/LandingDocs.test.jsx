import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import LandingDocs from '../components/LandingDocs';

// CSS modules are auto-mocked as identity (className === key) in jsdom via vite test config
describe('LandingDocs', () => {
    it('renderiza sin errores', () => {
        render(<LandingDocs />);
        expect(document.body).not.toBeEmptyDOMElement();
        expect(screen.getByText(/¿Cómo te ayuda ARGBOT\?/i)).toBeInTheDocument();
    });

    it('muestra el título de la sección principal', () => {
        render(<LandingDocs />);
        expect(screen.getByText(/¿Cómo te ayuda ARGBOT\?/i)).toBeInTheDocument();
    });

    it('muestra las tres características principales', () => {
        render(<LandingDocs />);
        // Text is split across <strong> + sibling text node — use getByText with substring on the container
        expect(screen.getByText((_, el) => el?.tagName === 'STRONG' && el.textContent === 'Cálculo exacto:')).toBeInTheDocument();
        expect(screen.getByText((_, el) => el?.tagName === 'STRONG' && el.textContent === 'Piloto automático:')).toBeInTheDocument();
        expect(screen.getByText((_, el) => el?.tagName === 'STRONG' && el.textContent === 'A donde vos quieras:')).toBeInTheDocument();
    });

    it('muestra la sección de advertencias previas', () => {
        render(<LandingDocs />);
        expect(screen.getByText(/Antes de arrancar/i)).toBeInTheDocument();
        expect(screen.getByText((_, el) => el?.tagName === 'STRONG' && el.textContent === 'Tu nombre tiene que coincidir:')).toBeInTheDocument();
        expect(screen.getByText((_, el) => el?.tagName === 'STRONG' && el.textContent === 'Cero transferencias SWIFT:')).toBeInTheDocument();
    });

    it('muestra la sección de seguridad', () => {
        render(<LandingDocs />);
        expect(screen.getByText(/Tu plata, tu seguridad/i)).toBeInTheDocument();
        expect(screen.getByText(/No tocamos tus fondos/i)).toBeInTheDocument();
        expect(screen.getByText(/Permisos mínimos \+ whitelist IP/i)).toBeInTheDocument();
        expect(screen.getByText(/Herramienta independiente/i)).toBeInTheDocument();
        expect(screen.getByText(/Las cosas claras/i)).toBeInTheDocument();
    });

    it('muestra la sección de confianza', () => {
        render(<LandingDocs />);
        expect(screen.getByText(/¿Por qué confiar en ARGBOT\?/i)).toBeInTheDocument();
        expect(screen.getByText('Encriptación AES-256 local')).toBeInTheDocument();
        expect(screen.getByText('Open Source')).toBeInTheDocument();
        expect(screen.getByText('Permisos mínimos')).toBeInTheDocument();
    });

    it('muestra las descripciones de las características correctamente', () => {
        render(<LandingDocs />);
        expect(screen.getByText(/Miramos el precio en tiempo real/i)).toBeInTheDocument();
        expect(screen.getByText(/El bot entra a Binance/i)).toBeInTheDocument();
        expect(screen.getByText(/cualquier billetera BEP20/i)).toBeInTheDocument();
    });
});
