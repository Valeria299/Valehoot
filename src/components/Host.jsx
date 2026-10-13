import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

// 📝 AQUÍ ESCRIBO Preguntas
const BANCO_DE_PREGUNTAS = [
  {
    id: 1,
    pregunta: "¿Qué tipo de programación usa Scratch?",
    opciones: [
      "No usa programación",
      "Programación por bloques",
      "Python"
    ],
    correcta: 1 // La segunda opción es la correcta (índice 1)
  },
  {
    id: 2,
    pregunta: "¿Qué bloque hace que el personaje camine?",
    opciones: [
      "Movimiento",
      "Sensor",
      "Eventos"
    ],
    correcta: 0 // La primera opción es la correcta (índice 0)
  },
  {
    id: 3,
    pregunta: "Si yo quiero agregar mi nombre en mi videojuego sin que cambie de posición, ¿Dónde debería hacerlo?",
    opciones: [
      "Perfil",
      "Personaje",
      "Fondo"
    ],
    correcta: 2 // La tercera opción es la correcta (índice 2)
  }
];

export default function Host() {
  const [players, setPlayers] = useState([]);
  const [preguntaAbierta, setPreguntaAbierta] = useState('');
  const [preguntaActualId, setPreguntaActualId] = useState(null);

  // Respuestas de las alumnas en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'players'), (snapshot) => {
      const listaJugadores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayers(listaJugadores);
    });

    return () => unsubscribe();
  }, []);

  // Lanzar Pregunta Abierta
  const lanzarPreguntaAbierta = async () => {
    if (!preguntaAbierta.trim()) return;
    await setDoc(doc(db, 'game_state', 'actual'), {
      fase: 'pregunta_abierta',
      pregunta: preguntaAbierta
    });
    alert('¡Pregunta abierta enviada!');
  };

  // Lanzar la pregunta seleccionada del banco
  const lanzarPregunta = async (q) => {
    setPreguntaActualId(q.id);

    await setDoc(doc(db, 'game_state', 'actual'), {
      fase: 'trivia',
      pregunta: q.pregunta,
      opciones: q.opciones,
      correcta: q.correcta,
      startTime: Date.now()
    });
  };

  // Mostrar Podio / Resultados finales
  const mostrarPodio = async () => {
    await setDoc(doc(db, 'game_state', 'actual'), {
      fase: 'resultados'
    });
  };

  // Ordenar alumnas por puntuación
  const jugadorasOrdenadas = [...players].sort((a, b) => (b.puntuacion_total || 0) - (a.puntuacion_total || 0));

  return (
    <div style={styles.container}>
      <h1>Panel de Host (Profesora) 👑</h1>
      <p style={styles.counter}>Alumnas conectadas: <strong>{players.length}</strong></p>

      {/* FASE 1: PREGUNTA ABIERTA */}
      <div style={styles.section}>
        <h2>Fase 1: Pregunta Abierta</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Escribe una pregunta para romper el hielo..."
            value={preguntaAbierta}
            onChange={(e) => setPreguntaAbierta(e.target.value)}
            style={styles.input}
          />
          <button onClick={lanzarPreguntaAbierta} style={styles.button}>Lanzar</button>
        </div>
        
        <h3>Respuestas Abiertas en tiempo real:</h3>
        {players.map((p) => (
          <div key={p.id} style={styles.playerCard}>
            <strong>{p.username}:</strong> {p.respuesta_abierta || 'Pensando...'}
          </div>
        ))}
      </div>

      {/* FASE 2: BANCO DE PREGUNTAS PRECARGADAS */}
      <div style={styles.section}>
        <h2>Fase 2: Banco de Preguntas Preparadas</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Haz clic en <strong>"🚀 Lanzar Pregunta"</strong> en la pregunta que quieras activar en la pantalla de tus alumnas.
        </p>

        {BANCO_DE_PREGUNTAS.map((q) => (
          <div 
            key={q.id} 
            style={{
              ...styles.questionItem,
              borderColor: preguntaActualId === q.id ? '#9333ea' : '#ddd',
              backgroundColor: preguntaActualId === q.id ? '#f3e8ff' : '#fff'
            }}
          >
            <div>
              <strong>Pregunta {q.id}: {q.pregunta}</strong>
              <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>
                Opciones: 1) {q.opciones[0]} | 2) {q.opciones[1]} | 3) {q.opciones[2]}
              </div>
            </div>
            <button 
              onClick={() => lanzarPregunta(q)}
              style={{ ...styles.button, backgroundColor: '#9333ea', minWidth: '120px' }}
            >
              {preguntaActualId === q.id ? '⚡ En curso' : '🚀 Lanzar'}
            </button>
          </div>
        ))}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button onClick={mostrarPodio} style={{ ...styles.button, backgroundColor: '#16a34a', padding: '0.8rem 2rem' }}>
            🏆 Mostrar Podio / Top 3 Final
          </button>
        </div>
      </div>

      {/* TABLA DE POSICIONES */}
      <div style={styles.section}>
        <h2>🏆 Tabla de Posiciones Actual</h2>
        {jugadorasOrdenadas.map((p, index) => (
          <div key={p.id} style={styles.scoreRow}>
            <span><strong>#{index + 1} {p.username}</strong></span>
            <span>{p.puntuacion_total || 0} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' },
  counter: { fontSize: '1.2rem', color: '#4b5563' },
  section: { backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' },
  input: { padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', flex: 1 },
  button: { padding: '0.75rem 1.2rem', color: '#fff', backgroundColor: '#9333ea', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  playerCard: { backgroundColor: '#fff', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', border: '1px solid #ddd' },
  questionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '6px', border: '2px solid #ddd', marginBottom: '0.75rem' },
  scoreRow: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem', border: '1px solid #e5e7eb' }
};