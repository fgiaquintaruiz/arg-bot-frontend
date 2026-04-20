import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#181A20', display: 'flex',
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '40px 20px', fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ color: '#EAECEF', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px' }}>
          Algo salió mal
        </h2>
        <p style={{ color: '#848E9C', fontSize: '13px', marginBottom: '24px', textAlign: 'center', maxWidth: '320px' }}>
          Ocurrió un error inesperado. Recargá la página para continuar.
        </p>
        {this.state.error && (
          <pre style={{
            backgroundColor: '#1E2329', border: '1px solid #2B3139', borderRadius: '8px',
            padding: '12px 16px', fontSize: '11px', color: '#F6465D',
            maxWidth: '400px', width: '100%', overflowX: 'auto', marginBottom: '20px',
          }}>
            {this.state.error.message}
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#F0B90B', color: '#181A20', border: 'none',
            borderRadius: '8px', padding: '12px 28px', fontSize: '14px',
            fontWeight: 700, cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          Recargar
        </button>
      </div>
    );
  }
}
