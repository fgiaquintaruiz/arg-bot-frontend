import React from 'react';
import LandingDocs from './LandingDocs';

// Props definition for the Login component
interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#fff' }}>
            <span style={{ fontSize: '3rem' }}>🤖</span><br />
            ARGBOT <span style={{ fontSize: '1rem', backgroundColor: '#334155', padding: '4px 8px', borderRadius: '12px', verticalAlign: 'middle' }}>v1.8.155</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '30px' }}>
            Remesas inteligentes y automatizadas de Europa a Argentina.
          </p>

          <button
              onClick={onLogin}
              style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', margin: '0 auto', gap: '10px', boxShadow: '0 4px 15px rgba(255,255,255,0.2)' }}
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '24px', height: '24px' }} />
            Continuar con Google
          </button>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '15px' }}>Sin contraseñas adicionales. Solo tu cuenta de Google.</p>
        </div>

        {/* Externalized Documentation Section */}
        <LandingDocs />

      </div>
  );
}