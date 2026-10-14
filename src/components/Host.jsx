import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

// 📝 BANCO DE PREGUNTAS ORGANIZADO POR SESIONES
const SESIONES = {
  "Sesión 2": [
    {
      id: "s2_1",
      pregunta: "¿Qué tipo de programación usa Scratch?",
      opciones: ["No usa programación", "Programación por bloques", "Python"],
      correcta: 1
    },
    {
      id: "s2_2",
      pregunta: "Si quiero que mi personaje camine, ¿Qué tipo de bloque puedo usar?",
      opciones: ["Movimiento", "Sensor", "Apariencia"],
      correcta: 0
    },
    {
      id: "s2_3",
      pregunta: "Si quiero ponerle mi nombre al videojuego sin que cambie de posición, ¿Dónde debería hacerlo?",
      opciones: ["Personaje", "Perfil", "Escenario"],
      correcta: 2
    }
  ],
  "Sesión 3": [
    {
      id: "s3_1",
      pregunta: "¿Qué es la secuenciación?",
    opciones: [
      "El orden específico en el que se ejecutan las instrucciones de un algoritmo.",
      "La corrección automática de errores en el programa.",
      "La evaluación de una condición para tomar decisiones"
    ],
    correcta: 0
  },
  {
    id: 2,
    pregunta: "¿Cuál es un tipo de bucle en Scratch?",
    opciones: [
      "Enviar mensaje",
      "Por siempre",
      "Esperar"
    ],
    correcta: 1
  },
  {
    id: 3,
    pregunta: "¿Qué permite repetir una instrucción varias veces?",
    opciones: [
      "Variable",
      "Bucle",
      "Evento"
    ],
      correcta: 1
    }
  ],
  "Sesión 4": [
    {
      id: "s4_1",
      pregunta: "¿Qué es un evento en Scratch?",
      opciones: ["Un operador matemático.", "Un bloque que repite instrucciones indefinidamente.", "Algo que desencadena una acción en el programa."],
      correcta: 2
    },
    {
      id: "s4_2",
      pregunta: "¿Cuál de los siguientes es un ejemplo de un evento en Scratch?",
      opciones: ["Cuando presionamos una tecla.", "Cuando se suman dos números.", "Cuando se crea una variable."],
      correcta: 0
    },
    {
      id: "s4_3",
      pregunta: "¿Cuál de los siguientes es un ejemplo de una condicional?",
      opciones: ["Si el personaje toca el borde, entonces rebota.", "Repetir un bloque 10 veces.", "Mostrar una variable en pantalla."],
      correcta: 0
    }
  ],
  "Sesión 5": [
    {
      id: "s5_1",
      pregunta: "¿Para qué sirve Firebase Firestore?",
      opciones: ["Base de datos NoSQL en tiempo real", "Diseño gráfico", "Editor de texto"],
      correcta: 0
    },
    {
      id: "s5_2",
      pregunta: "¿En qué plataforma desplegamos nuestra aplicación web?",
      opciones: ["Vercel", "Photoshop", "Word"],
      correcta: 0
    }
  ]
};

export default function Host() {
  const [players, setPlayers] = useState([]);
  const [preguntaAbierta, setPreguntaAbierta] = useState('');
  const [preguntaActualId, setPreguntaActualId] = useState(null);
  const [sesionActiva, setSesionActiva] = useState('Sesión 2');

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

  // 🔄 REINICIAR EL JUEGO A CERO
  const reiniciarJuego = async () => {
    const confirmar = window.confirm("¿Segura que deseas reiniciar todos los puntos y respuestas a cero?");
    if (!confirmar) return;

    try {
      await setDoc(doc(db, 'game_state', 'actual'), {
        fase: 'espera'
      });

      const promesas = players.map(p => 
        updateDoc(doc(db, 'players', p.id), {
          puntuacion_total: 0,
          respuesta_abierta: ''
        })
      );

      await Promise.all(promesas);
      setPreguntaActualId(null);
      alert('¡El juego se ha reiniciado! Todos los puntos están en 0.');
    } catch (error) {
      console.error('Error al reiniciar:', error);
      alert('Hubo un error al reiniciar.');
    }
  };

  // LANZAR PREGUNTA ABIERTA
  const lanzarPreguntaAbierta = async () => {
    if (!preguntaAbierta.trim()) return;
    await setDoc(doc(db, 'game_state', 'actual'), {
      fase: 'pregunta_abierta',
      pregunta: preguntaAbierta
    });
    alert('¡Pregunta abierta enviada!');
  };

  // LANZAR TRIVIA
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

  // MOSTRAR PODIO
  const mostrarPodio = async () => {
    await setDoc(doc(db, 'game_state', 'actual'), {
      fase: 'resultados'
    });
  };

  const jugadorasOrdenadas = [...players].sort((a, b) => (b.puntuacion_total || 0) - (a.puntuacion_total || 0));

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h1>Panel de Host (Profesora) 👑</h1>
        <button onClick={reiniciarJuego} style={styles.resetBtn}>
          🔄 Reiniciar Puntos a 0
        </button>
      </div>

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

      {/* FASE 2: SECCIONES Y PREGUNTAS POR SESIÓN */}
      <div style={styles.section}>
        <h2>Fase 2: Banco de Preguntas</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Selecciona el número de sesión para ver las preguntas preparadas:
        </p>

        {/* PESTAÑAS DE SESIONES */}
        <div style={styles.tabsContainer}>
          {Object.keys(SESIONES).map((sesionNombre) => (
            <button
              key={sesionNombre}
              onClick={() => setSesionActiva(sesionNombre)}
              style={{
                ...styles.tabBtn,
                backgroundColor: sesionActiva === sesionNombre ? '#4a3d89' : '#e5e7eb',
                color: sesionActiva === sesionNombre ? '#ffffff' : '#374151',
                fontWeight: sesionActiva === sesionNombre ? 'bold' : 'normal'
              }}
            >
              {sesionNombre}
            </button>
          ))}
        </div>

        {/* PREGUNTAS DE LA SESIÓN SELECCIONADA */}
        <div style={{ marginTop: '1rem' }}>
          <h3>Preguntas de {sesionActiva}:</h3>
          {SESIONES[sesionActiva].map((q) => (
            <div 
              key={q.id} 
              style={{
                ...styles.questionItem,
                borderColor: preguntaActualId === q.id ? '#9333ea' : '#ddd',
                backgroundColor: preguntaActualId === q.id ? '#f3e8ff' : '#fff'
              }}
            >
              <div>
                <strong>{q.pregunta}</strong>
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
        </div>

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
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
  resetBtn: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  counter: { fontSize: '1.2rem', color: '#4b5563', marginTop: '0.5rem' },
  section: { backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' },
  input: { padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', flex: 1 },
  button: { padding: '0.75rem 1.2rem', color: '#fff', backgroundColor: '#9333ea', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  playerCard: { backgroundColor: '#fff', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', border: '1px solid #ddd' },
  tabsContainer: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' },
  tabBtn: { padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.95rem' },
  questionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '6px', border: '2px solid #ddd', marginBottom: '0.75rem' },
  scoreRow: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem', border: '1px solid #e5e7eb' }
};