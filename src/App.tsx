import pkg from "../package.json";
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { loginWithGoogle } from './authService';
import Login from './components/Login';
import Dashboard from './Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationOptIn from './components/NotificationOptIn';

// E2E test seam — Playwright sets window.__E2E_USER__ via addInitScript before app code runs.
// In production this is always undefined → null → Firebase auth runs normally.
const e2eUser: any = (window as any).__E2E_USER__ ?? null;

function App() {
  const [user, setUser] = useState<any>(e2eUser);
  const [loading, setLoading] = useState(e2eUser === null);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    /* v8 ignore start */
    if (e2eUser) return;
    /* v8 ignore end */
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    setRejected(false);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      if (error?.message === 'ACCESS_DENIED') {
        setRejected(true);
      } else {
        console.error("Error during Google Login:", error);
      }
    }
  };

  if (loading) return (
    <div style={{ backgroundColor: '#181A20', height: '100vh', color: '#EAECEF', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '14px', letterSpacing: '-0.2px' }}>
      ARG<span style={{ color: '#F0B90B' }}>BOT</span> v{pkg.version}
    </div>
  );

  return (
    <ErrorBoundary>
      {(user && !rejected)
        ? <><Dashboard user={user} /><NotificationOptIn /></>
        : <Login onLogin={handleLogin} rejected={rejected} />}
    </ErrorBoundary>
  );
}
export default App;
