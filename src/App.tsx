import pkg from "../package.json";
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { loginWithGoogle } from './authService'; // <-- Import the login function
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

  // Handle the login process
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Error during Google Login:", error);
    }
  };

  if (loading) return (
      <div style={{backgroundColor:'#0f172a', height:'100vh', color:'white', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'sans-serif'}}>
        ARGBOT v{pkg.version}
      </div>
  );

  // Pass the handleLogin function to the onLogin prop
  return user ? <Dashboard user={user} /> : <Login onLogin={handleLogin} />;
}
export default App;