import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Host from './components/Host';
import PlayerView from './components/PlayerView';

function App() {
  const [user, setUser] = useState(null);
  const path = window.location.pathname;

  useEffect(() => {
    const savedUser = localStorage.getItem('valehoot_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (path === '/host') {
    return <Host />;
  }

  const handleLogout = () => {
    localStorage.removeItem('valehoot_user');
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return <PlayerView user={user} onLogout={handleLogout} />;
}

export default App;