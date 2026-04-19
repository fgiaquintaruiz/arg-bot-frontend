import pkg from "../package.json";
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { loginWithGoogle } from './authService';
import Login from './components/Login';
import Dashboard from './Dashboard';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
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
      <div style={{backgroundColor:'#0f172a', height:'100vh', color:'white', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'sans-serif'}}>
        ARGBOT v{pkg.version}
      </div>
  );

  return (user && !rejected)
    ? <Dashboard user={user} />
    : <Login onLogin={handleLogin} rejected={rejected} />;
}
export default App;
