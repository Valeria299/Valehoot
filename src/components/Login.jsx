import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password) {
      setError('Por favor llena todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const playerRef = doc(db, 'players', cleanUser);
      const playerSnap = await getDoc(playerRef);

      if (playerSnap.exists()) {
        const playerData = playerSnap.data();
        if (playerData.password === password) {
          const sessionData = { username: cleanUser, role: 'player' };
          localStorage.setItem('valehoot_user', JSON.stringify(sessionData));
          onLoginSuccess(sessionData);
        } else {
          setError('Contraseña incorrecta.');
        }
      } else {
        const newPlayerData = {
          username: cleanUser,
          password: password,
          puntuacion_total: 0,
          respuesta_abierta: '',
          createdAt: serverTimestamp()
        };
        await setDoc(playerRef, newPlayerData);
        const sessionData = { username: cleanUser, role: 'player' };
        localStorage.setItem('valehoot_user', JSON.stringify(sessionData));
        onLoginSuccess(sessionData);
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>¡Bienvenida a Valehoot! 💜</h1>
        <p style={styles.subtitle}>Ingresa tu usuario y contraseña para entrar al juego.</p>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          
          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#604ab9',
    padding: '1rem',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: '#ffff',
    padding: '2.5rem 1.5rem',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  title: {
    color: '#6b21a8',
    fontSize: '1.8rem',
    lineHeight: '1.3',
    margin: '0 0 0.5rem 0',
    fontWeight: '800'
  },
  subtitle: {
    color: '#4b5563',
    fontSize: '0.95rem',
    margin: '0 0 1.5rem 0',
    lineHeight: '1.4'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  input: {
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '1rem',
    outline: 'none'
  },
  button: {
    padding: '0.9rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#9333ea',
    color: '#ffffff',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem'
  },
  error: {
    color: '#dc2626',
    fontSize: '0.85rem',
    margin: 0
  }
};