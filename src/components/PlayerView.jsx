import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, collection } from 'firebase/firestore';

export default function PlayerView({ user, onLogout }) {
  const [gameState, setGameState] = useState(null);
  const [respuestaAbierta, setRespuestaAbierta] = useState('');
  const [enviadoAbierta, setEnviadoAbierta] = useState(false);

  // Estados Trivia
  const [timeLeft, setTimeLeft] = useState(20);
  const [respondidoTrivia, setRespondidoTrivia] = useState(false);
  const [puntosGanados, setPuntosGanados] = useState(null);
  const [players, setPlayers] = useState([]);

  // Escuchar el juego en tiempo real
  useEffect(() => {
    const unsubGame = onSnapshot(doc(db, 'game_state', 'actual'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState(data);

        // Si entramos a trivia, reiniciar estados
        if (data.fase === 'trivia') {
          setRespondidoTrivia(false);
          setPuntosGanados(null);
        }
        if (data.fase === 'pregunta_abierta') {
          setEnviadoAbierta(false);
          setRespuestaAbierta('');
        }
      }
    });

    // Escuchar jugadoras para el podio y respuestas compartidas
    const unsubPlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPlayers(list);
    });

    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, []);

  // Cronómetro de 20 segundos para la trivia
  useEffect(() => {
    if (gameState?.fase === 'trivia' && gameState.startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const remaining = Math.max(20 - elapsed, 0);
        setTimeLeft(remaining);
      }, 500);

      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Enviar Respuesta Abierta
  const enviarRespuestaAbierta = async (e) => {
    e.preventDefault();
    if (!respuestaAbierta.trim()) return;
    await updateDoc(doc(db, 'players', user.username), { respuesta_abierta: respuestaAbierta });
    setEnviadoAbierta(true);
  };

  // Responder Opción de Trivia
  const responderTrivia = async (indexOpcion) => {
    if (respondidoTrivia || timeLeft === 0) return;

    setRespondidoTrivia(true);
    const esCorrecta = indexOpcion === gameState.correcta;

    if (esCorrecta) {
      const puntos = timeLeft * 50 + 100;
      setPuntosGanados(puntos);

      const me = players.find(p => p.username === user.username);
      const puntosActuales = me?.puntuacion_total || 0;

      await updateDoc(doc(db, 'players', user.username), {
        puntuacion_total: puntosActuales + puntos
      });
    } else {
      setPuntosGanados(0);
    }
  };

  const top3 = [...players]
    .sort((a, b) => (b.puntuacion_total || 0) - (a.puntuacion_total || 0))
    .slice(0, 3);

  const respuestasCompaneras = players.filter(p => p.respuesta_abierta && p.respuesta_abierta.trim() !== '');

  return (
    <div style={styles.pageBackground}>
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <span style={styles.userInfo}>Jugadora: <strong>{user.username}</strong></span>
          <button onClick={onLogout} style={styles.logoutBtn}>Salir</button>
        </header>

        {/* ESPERA */}
        {(!gameState || gameState.fase === 'espera') && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>⏳ Sala de Espera</h2>
            <p style={styles.subtitleText}>Preparadas... La instructora iniciará la actividad pronto.</p>
          </div>
        )}

        {/* FASE 1: PREGUNTA ABIERTA */}
        {gameState?.fase === 'pregunta_abierta' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>✨ Vamos a romper el hielo ✨</h2>
            <h3 style={styles.questionText}>{gameState.pregunta}</h3>

            {enviadoAbierta ? (
              <p style={styles.successMsg}>✅ ¡Respuesta enviada!</p>
            ) : (
              <form onSubmit={enviarRespuestaAbierta} style={styles.form}>
                <input
                  type="text"
                  placeholder="Escribe tu respuesta..."
                  value={respuestaAbierta}
                  onChange={(e) => setRespuestaAbierta(e.target.value)}
                  style={styles.input}
                />
                <button type="submit" style={styles.button}>Enviar</button>
              </form>
            )}

            {/* MURO DE RESPUESTAS */}
            <div style={styles.wallContainer}>
              <h4 style={styles.wallTitle}>💬 Respuestas del grupo:</h4>
              {respuestasCompaneras.length === 0 ? (
                <p style={{ color: '#888', fontSize: '0.85rem' }}>Sé la primera en responder...</p>
              ) : (
                <div style={styles.wallList}>
                  {respuestasCompaneras.map((p) => (
                    <div key={p.id} style={styles.wallBubble}>
                      <span style={styles.wallUsername}>@{p.username}</span>
                      <p style={styles.wallText}>{p.respuesta_abierta}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FASE 2: TRIVIA */}
        {gameState?.fase === 'trivia' && (
          <div style={styles.card}>
            <div style={styles.timer}>⏱️ Tiempo: {timeLeft}s</div>
            <h2 style={styles.questionText}>{gameState.pregunta}</h2>

            {respondidoTrivia ? (
              <div style={{ marginTop: '1.5rem' }}>
                {puntosGanados > 0 ? (
                  <h3 style={{ color: '#16a34a' }}>🎉 ¡Correcto! +{puntosGanados} pts</h3>
                ) : (
                  <h3 style={{ color: '#dc2626' }}>❌ Incorrecto, sé que tú puedes, no te desanimes</h3>
                )}
                <p style={{ marginTop: '0.5rem', color: '#666' }}>Esperando a la siguiente pregunta...</p>
              </div>
            ) : (
              <div style={styles.triviaGrid}>
                {gameState.opciones?.map((op, idx) => (
                  <button
                    key={idx}
                    disabled={timeLeft === 0}
                    onClick={() => responderTrivia(idx)}
                    style={{
                      ...styles.triviaBtn,
                      backgroundColor: idx === 0 ? '#ef4444' : idx === 1 ? '#3b82f6' : '#eab308'
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FASE 3: PODIO / RESULTADOS */}
        {gameState?.fase === 'resultados' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🏆 Top 3 Ganadoras 🏆</h2>
            <div style={styles.podium}>
              {top3.map((p, idx) => (
                <div key={p.id} style={styles.podiumCard}>
                  <div style={{ fontSize: '1.5rem' }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <strong>{p.username}</strong>
                  <div style={{ color: '#4a3d89', fontWeight: 'bold' }}>{p.puntuacion_total || 0} pts</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageBackground: {
    backgroundColor: '#604ab9',
    width: '100vw',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1.5rem',
    boxSizing: 'border-box'
  },
  wrapper: {
    width: '100%',
    maxWidth: '440px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    backdropFilter: 'blur(5px)'
  },
  userInfo: {
    color: '#ffffff',
    fontSize: '0.95rem'
  },
  logoutBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.85rem'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '2rem 1.5rem',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    boxSizing: 'border-box'
  },
  cardTitle: {
    color: '#4a3d89',
    fontSize: '1.5rem',
    margin: '0 0 0.5rem 0',
    fontWeight: '800'
  },
  subtitleText: {
    color: '#4b5563',
    fontSize: '0.95rem',
    margin: 0
  },
  questionText: {
    color: '#4a3d89',
    fontSize: '1.25rem',
    margin: '1rem 0 1.5rem 0',
    lineHeight: '1.4'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  input: {
    padding: '0.85rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box'
  },
  button: {
    padding: '0.85rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#4a3d89',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  successMsg: {
    color: '#16a34a',
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  timer: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#4a3d89',
    marginBottom: '0.5rem'
  },
  triviaGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  triviaBtn: {
    padding: '1rem',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  podium: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  podiumCard: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  wallContainer: {
    marginTop: '1.5rem',
    textAlign: 'left',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '1rem'
  },
  wallTitle: {
    margin: '0 0 0.75rem 0',
    color: '#4a3d89',
    fontSize: '0.95rem'
  },
  wallList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '180px',
    overflowY: 'auto'
  },
  wallBubble: {
    backgroundColor: '#f3f0ff',
    padding: '0.6rem 0.8rem',
    borderRadius: '8px'
  },
  wallUsername: {
    fontSize: '0.75rem',
    color: '#4a3d89',
    fontWeight: 'bold',
    display: 'block'
  },
  wallText: {
    margin: '0.2rem 0 0 0',
    fontSize: '0.9rem',
    color: '#333333'
  }
};