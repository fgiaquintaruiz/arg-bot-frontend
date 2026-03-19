import pkg from "../package.json";
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Login from './components/Login';
import Dashboard from './Dashboard';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{backgroundColor:'#0f172a', height:'100vh', color:'white', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'sans-serif'}}>
      ARGBOT v{pkg.version}
    </div>
  );
  return user ? <Dashboard user={user} /> : <Login />;
}
export default App;
