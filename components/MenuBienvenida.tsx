'use client';

import { useState } from 'react';
import { getOrCreateStudentProfile, type StudentProfile } from './sessionStore';

interface MenuBienvenidaProps {
  alIniciarSesion: (profile: StudentProfile) => void;
}

export default function MenuBienvenida({ alIniciarSesion }: MenuBienvenidaProps) {
  const [studentId, setStudentId] = useState('');
  const [pantalla, setPantalla] = useState(1);
  const [perfilPendiente, setPerfilPendiente] = useState<StudentProfile | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const paginas = [
    {
      titulo: '¡Bienvenido a tu Espacio de Calma!',
      texto: 'Esta playa virtual es un entorno seguro diseñado para tu relajación y regulación emocional. Tómate el tiempo necesario para explorar a tu ritmo.'
    },
    {
      titulo: 'Como Moverte en PC (Modo Videojuego)',
      texto: 'Usa W, A, S, D para caminar. Haz clic en la pantalla y arrastra el mouse para mirar. En Meta Quest usa los joysticks.'
    },
    {
      titulo: 'Zonas de Interaccion',
      texto: 'Acercate a los marcadores flotantes para abrir las interfaces de mesa psicologica, tocadiscos y pelota.'
    }
  ];

  const idValido = /^[a-zA-Z0-9_-]{4,24}$/.test(studentId.trim());

  const iniciarSesion = () => {
    const input = studentId.trim();
    if (!idValido) {
      setError('Usa un ID alfanumérico de 4 a 24 caracteres.');
      return;
    }

    try {
      const { profile, isNew } = getOrCreateStudentProfile(input);
      setError('');
      setFeedback(
        isNew
          ? `Nuevo perfil creado para ${profile.studentId}.`
          : `Sesión reanudada para ${profile.studentId}. Cartas guardadas: ${profile.letters.length}.`
      );
      setPerfilPendiente(profile);
      setPantalla(2);
    } catch {
      setError('No se pudo iniciar la sesión local. Inténtalo de nuevo.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(10, 10, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999, // Garantiza ir por encima de todo el Canvas de Three.js
      fontFamily: 'system-ui, sans-serif',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#12121c',
        color: '#f0f0f5',
        padding: '30px',
        borderRadius: '16px',
        width: '420px',
        maxWidth: '100%',
        boxShadow: '0px 20px 50px rgba(0,0,0,0.9)',
        border: '2px solid #ff9d42',
        textAlign: 'left'
      }}>
        {pantalla === 1 ? (
          <>
            <h3 style={{ margin: '0 0 8px 0', color: '#ff9d42', fontSize: '22px', fontWeight: 'bold' }}>
              Playa Psicológica
            </h3>
            <p style={{ margin: '0 0 18px 0', color: '#c7c7d8', fontSize: '14px', lineHeight: 1.5 }}>
              Ingresa tu código universitario para crear o retomar tu sesión terapéutica.
            </p>

            <label htmlFor="student-id-input" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#9ea0b9' }}>
              Student ID / University Code
            </label>
            <input
              id="student-id-input"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="Ej: UDEM2026A15"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderTopColor: '#30374f',
                borderRightColor: '#30374f',
                borderBottomColor: '#30374f',
                borderLeftColor: '#30374f',
                backgroundColor: '#0d101a',
                color: '#f7f7ff',
                marginBottom: '12px'
              }}
            />

            <ul style={{ margin: '0 0 14px 0', paddingLeft: '18px', color: '#c7c7d8', fontSize: '13px', lineHeight: 1.5 }}>
              <li>WASD/Arrow keys para caminar (desktop).</li>
              <li>Arrastra para mirar en móvil.</li>
              <li>En Quest, usa joysticks para desplazamiento.</li>
            </ul>

            {error ? <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#ff8f8f' }}>{error}</p> : null}
            {feedback ? <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#8fd4a4' }}>{feedback}</p> : null}

            <button
              onClick={iniciarSesion}
              style={{
                ...estiloBoton,
                width: '100%',
                backgroundColor: idValido ? '#28a745' : '#4f5968',
                borderTopColor: idValido ? '#28a745' : '#4f5968',
                borderRightColor: idValido ? '#28a745' : '#4f5968',
                borderBottomColor: idValido ? '#28a745' : '#4f5968',
                borderLeftColor: idValido ? '#28a745' : '#4f5968',
                cursor: idValido ? 'pointer' : 'not-allowed',
                padding: '12px 16px',
                fontSize: '14px'
              }}
              disabled={!idValido}
            >
              Continuar
            </button>
          </>
        ) : (
          <>
            <h3 style={{ margin: '0 0 8px 0', color: '#ff9d42', fontSize: '22px', fontWeight: 'bold' }}>
              {paginas[pantalla - 2].titulo}
            </h3>
            <p style={{ margin: '0 0 18px 0', color: '#c7c7d8', fontSize: '14px', lineHeight: 1.6, minHeight: 88 }}>
              {paginas[pantalla - 2].texto}
            </p>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#8fd4a4' }}>
              Sesion activa: {perfilPendiente?.studentId}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setPantalla((prev) => Math.max(2, prev - 1))} style={estiloBoton}>
                Atras
              </button>
              <span style={{ fontSize: '12px', color: '#9ea0b9' }}>{pantalla - 1} / 3</span>
              {pantalla < 4 ? (
                <button onClick={() => setPantalla((prev) => Math.min(4, prev + 1))} style={estiloBoton}>
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (perfilPendiente) alIniciarSesion(perfilPendiente);
                  }}
                  style={{
                    ...estiloBoton,
                    backgroundColor: '#28a745',
                    borderTopColor: '#28a745',
                    borderRightColor: '#28a745',
                    borderBottomColor: '#28a745',
                    borderLeftColor: '#28a745'
                  }}
                >
                  Entrar a la Playa
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const estiloBoton = {
  backgroundColor: '#ff9d42',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderTopColor: '#ff9d42',
  borderRightColor: '#ff9d42',
  borderBottomColor: '#ff9d42',
  borderLeftColor: '#ff9d42',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold' as const,
  fontSize: '13px',
  transition: 'transform 0.1s ease'
};