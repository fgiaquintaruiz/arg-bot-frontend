import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import Login from '../components/Login';

vi.mock('../components/LandingDocs', () => ({
  default: function MockLandingDocs() {
    return <div data-testid="landing-docs">Landing Docs</div>;
  }
}));

vi.mock('../components/Updates', () => ({
  default: function MockUpdates({ onClose }) {
    return <div data-testid="updates"><button onClick={onClose}>Close Updates</button></div>;
  }
}));

vi.mock('../components/LegalModal', () => ({
  default: function MockLegalModal({ onClose }) {
    return <div data-testid="legal-modal"><button onClick={onClose}>Close Legal</button></div>;
  }
}));

describe('Login Component', () => {
  it('should render login page with branding', () => {
    render(<Login onLogin={() => {}} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Transferencias internacionales automatizadas/)).toBeInTheDocument();
  });

  it('should display Google login button', () => {
    render(<Login onLogin={() => {}} />);
    const loginButton = screen.getByRole('button', { name: /Continuar con Google/ });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveTextContent('Google');
  });

  it('should call onLogin when Google button is clicked', () => {
    const mockOnLogin = vi.fn();
    render(<Login onLogin={mockOnLogin} />);
    const loginButton = screen.getByRole('button', { name: /Continuar con Google/ });
    fireEvent.click(loginButton);
    expect(mockOnLogin).toHaveBeenCalledTimes(1);
  });

  it('should display "No hay contraseñas" message', () => {
    render(<Login onLogin={() => {}} />);
    expect(screen.getByText(/Sin contraseña adicional/)).toBeInTheDocument();
  });

  it('should open updates modal when Roadmap button is clicked', () => {
    render(<Login onLogin={() => {}} />);
    const roadmapButton = screen.getByText(/Novedades y Roadmap/);
    fireEvent.click(roadmapButton);
    expect(screen.getByTestId('updates')).toBeInTheDocument();
  });

  it('should open legal modal when Terms button is clicked', () => {
    render(<Login onLogin={() => {}} />);
    const termsButton = screen.getByText(/Términos y Condiciones/);
    fireEvent.click(termsButton);
    expect(screen.getByTestId('legal-modal')).toBeInTheDocument();
  });

  it('should open legal modal when Privacy button is clicked', () => {
    render(<Login onLogin={() => {}} />);
    const privacyButton = screen.getByText(/Políticas de Privacidad/);
    fireEvent.click(privacyButton);
    expect(screen.getByTestId('legal-modal')).toBeInTheDocument();
  });

  it('should close updates modal when close button is clicked', () => {
    render(<Login onLogin={() => {}} />);
    fireEvent.click(screen.getByText(/Novedades y Roadmap/));
    fireEvent.click(screen.getByText('Close Updates'));
    expect(screen.queryByTestId('updates')).not.toBeInTheDocument();
  });

  it('should close legal modal when close button is clicked', () => {
    render(<Login onLogin={() => {}} />);
    fireEvent.click(screen.getByText(/Términos y Condiciones/));
    fireEvent.click(screen.getByText('Close Legal'));
    expect(screen.queryByTestId('legal-modal')).not.toBeInTheDocument();
  });

  it('should render LandingDocs component', () => {
    render(<Login onLogin={() => {}} />);
    expect(screen.getByTestId('landing-docs')).toBeInTheDocument();
  });

  it('should display access restricted banner', () => {
    render(<Login onLogin={() => {}} />);
    expect(screen.getByText(/Acceso restringido/)).toBeInTheDocument();
  });
});
