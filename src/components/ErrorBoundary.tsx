import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

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
      <div className={styles.wrapper}>
        <div className={styles.icon}>⚠️</div>
        <h2 className={styles.title}>
          Algo salió mal
        </h2>
        <p className={styles.description}>
          Ocurrió un error inesperado. Recargá la página para continuar.
        </p>
        {this.state.error && (
          <pre className={styles['error-pre']}>
            {this.state.error.message}
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          className={styles['reload-button']}
        >
          Recargar
        </button>
      </div>
    );
  }
}
