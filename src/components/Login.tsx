import React, { useState } from 'react';
import LandingDocs from './LandingDocs';
import Updates from './Updates';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showUpdates, setShowUpdates] = useState(false);

  return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#fff' }}>
            <span style={{ fontSize: '3rem' }}>🤖</span><br />
            ARGBOT <span style={{ fontSize: '1rem', backgroundColor: '#334155', padding: '4px 8px', borderRadius: '12px', verticalAlign: 'middle' }}>v1.8.157</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '30px' }}>
            Remesas inteligentes y automatizadas de Europa a Argentina.
          </p>

          <button
              onClick={onLogin}
              style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', margin: '0 auto', gap: '10px', boxShadow: '0 4px 15px rgba(255,255,255,0.2)' }}
          ><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '24px', height: '24px' }} />
            Continuar con Google
          </button>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '15px' }}>Sin contraseñas adicionales. Solo tu cuenta de Google.</p>
        </div>

        <LandingDocs />

        {/* Botón sutil en el pie de página */}
        <div style={{ textAlign: 'center', marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #334155' }}>
          <button onClick={() => setShowUpdates(true)} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
            Ver Novedades y Hoja de Ruta (Changelog & Roadmap)
          </button>
        </div>

        {/* Renderizado condicional del modal */}
        {showUpdates && <Updates onClose={() => setShowUpdates(false)} />}
      </div>
  );
}