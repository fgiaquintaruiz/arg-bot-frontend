import React from 'react';
import { loginWithGoogle } from '../authService';
import pkg from '../../package.json';

export default function Login() {
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
      alert("Error al abrir Google Login. Verifica las credenciales de Firebase en tu código.");
    }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', width: '100vw', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f8fafc', overflowY: 'auto', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            ARGBOT <span style={{ fontSize: '1rem', color: '#64748b', verticalAlign: 'middle', fontWeight: 500 }}>v{pkg.version}</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '10px' }}>
            Remesas inteligentes de Europa a Argentina.
          </p>
        </div>

        {/* Cajas principales (Login + Comparativa) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
          
          {/* Caja de Login */}
          <div style={{ flex: '1 1 300px', backgroundColor: '#1e293b', padding: '32px', borderRadius: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', textAlign: 'center' }}>Ingresa a tu panel</h2>
            <button 
              onClick={handleLogin} 
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#ffffff', color: '#3c4043', border: '1px solid #dadce0', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '15px', boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)', transition: 'background-color 0.2s' }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continuar con Google
            </button>
            <p style={{ margin: '20px 0 0 0', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              Sin contraseñas adicionales. Solo tu cuenta de Google.
            </p>
          </div>

          {/* Caja Comparativa */}
          <div style={{ flex: '1 1 350px', backgroundColor: '#0f172a', padding: '32px', borderRadius: '24px', border: '1px solid #3b82f6', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #3b82f6, #10b981)' }}></div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#e0e7ff' }}>¿Por qué ARGBOT?</h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
              Las plataformas tradicionales (Remitly, Western Union) cobran comisiones ocultas y ofrecen un tipo de cambio desfavorable. 
              Nosotros automatizamos el mercado Crypto P2P para darte el valor real.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Tradicional</span>
                <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>Comisiones altas</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>ARGBOT</span>
                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>Tipo de cambio libre</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección FAQ */}
        <div style={{ marginTop: '20px', padding: '32px', backgroundColor: '#1e293b', borderRadius: '24px', border: '1px solid #334155' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', textAlign: 'center' }}>Preguntas Frecuentes de Seguridad</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ color: '#38bdf8', fontSize: '1rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛡️ ¿Es seguro conectar mi cuenta de Binance?
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Sí. Tus API Keys se guardan cifradas exclusivamente en el almacenamiento local de tu navegador (localStorage). Nuestro servidor nunca tiene acceso a ellas ni las guarda en ninguna base de datos externa.
              </p>
            </div>
            
            <hr style={{ border: 0, borderTop: '1px solid #334155' }} />

            <div>
              <h3 style={{ color: '#38bdf8', fontSize: '1rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🤖 ¿Qué hace la app con las claves?
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
                El bot solo las usa temporalmente para automatizar tres pasos: leer tu saldo en EUR, ejecutar el trade (comprar USDC) y solicitar el retiro a la dirección de tu broker argentino que vos mismo configures.
              </p>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid #334155' }} />

            <div>
              <h3 style={{ color: '#38bdf8', fontSize: '1rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔑 ¿Qué permisos le doy a las API Keys en Binance?
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Por tu propia seguridad, al crear las llaves en Binance solo debes marcar "Enable Reading", "Enable Spot & Margin Trading" y "Enable Withdrawals". Recomendamos fervientemente usar la <b>Whitelist de direcciones</b> de Binance para que solo se pueda retirar a tu propia cuenta de Buenbit/Lemon.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: '20px' }}>
          ARGBOT - Herramienta independiente sin afiliación oficial con Binance.
        </div>

      </div>
    </div>
  );
}
