import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary';

function ThrowingComponent({ shouldThrow = false, message = 'Test error' }) {
  if (shouldThrow) throw new Error(message);
  return <div>Contenido normal</div>;
}

// Suprimimos console.error porque React loguea errores de boundaries por defecto
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renderiza los children cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Contenido normal')).toBeInTheDocument();
    expect(screen.queryByText(/Algo salió mal/)).not.toBeInTheDocument();
  });

  it('captura el error y muestra el fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.queryByText('Contenido normal')).not.toBeInTheDocument();
  });

  it('muestra el mensaje de error en el fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} message="Error específico de prueba" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Error específico de prueba')).toBeInTheDocument();
  });

  it('muestra texto de instrucción para recargar la página', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Recargá la página para continuar/)).toBeInTheDocument();
  });

  it('muestra botón "Recargar"', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Recargar')).toBeInTheDocument();
  });

  it('click en "Recargar" llama a window.location.reload', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      configurable: true,
      writable: true,
    });
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText('Recargar'));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('componentDidCatch loguea el error con console.error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} message="Error logged" />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalledWith(
      '[ErrorBoundary]',
      expect.any(Error),
      expect.any(String)
    );
  });

  it('renderiza múltiples children sin error', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('error con mensaje vacío muestra el fallback igual', () => {
    function EmptyErrorComponent() {
      throw new Error('');
    }
    render(
      <ErrorBoundary>
        <EmptyErrorComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });
});
