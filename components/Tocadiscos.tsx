'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D } from 'three';
import { Html } from '@react-three/drei';
import { LISTA_CANCIONES } from './useBeachAudio';

interface TocadiscosProps {
  scene: Object3D;
  reproduciendo: boolean;
  cancionActualIndex: number;
  togglePlayPausa: () => void;
  siguienteCancion: () => void;
  seleccionarCancion: (index: number) => void;
}

export default function Tocadiscos({
  scene,
  reproduciendo,
  cancionActualIndex,
  togglePlayPausa,
  siguienteCancion,
  seleccionarCancion,
}: TocadiscosProps) {
  const discoRef  = useRef<Object3D | null>(null);
  const muebleRef = useRef<Object3D | null>(null);
  const [mostrarMenu, setMostrarMenu] = useState(false);

  useEffect(() => {
    if (!scene) return;
    const disco =
      scene.getObjectByName('record')       ||
      scene.getObjectByName('record_plate') ||
      scene.getObjectByName('disco');
    if (disco) discoRef.current = disco;

    const mueble =
      scene.getObjectByName('gramophone') ||
      scene.getObjectByName('tocadiscos') ||
      disco;
    if (mueble) muebleRef.current = mueble;
  }, [scene]);

  useFrame((_, delta) => {
    if (reproduciendo && discoRef.current) {
      discoRef.current.rotation.y += delta * 1.5;
    }
  });

  const posBase: [number, number, number] = muebleRef.current
    ? [muebleRef.current.position.x, muebleRef.current.position.y, muebleRef.current.position.z]
    : [1.7, 1.42, -5.9];

  const posMenu: [number, number, number] = [posBase[0], posBase[1] + 0.65, posBase[2]];

  return (
    <group name="tocadiscos-interactivo">

      {/* Caja invisible de click sobre el aparato */}
      <mesh
        position={[posBase[0], posBase[1] + 0.15, posBase[2]]}
        onClick={(e) => { e.stopPropagation(); setMostrarMenu((v) => !v); }}
      >
        <boxGeometry args={[0.65, 0.5, 0.65]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Hint cuando está cerrado */}
      {!mostrarMenu && (
        <Html position={posBase} center distanceFactor={3}>
          <div style={{
            background: 'rgba(0,0,0,0.75)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            🎵 Clic para reproducir música
          </div>
        </Html>
      )}

      {/* Menú flotante de reproducción */}
      {mostrarMenu && (
        <Html
          position={posMenu}
          transform
          occlude={false}
          distanceFactor={1.2}
          style={{ userSelect: 'none' }}
        >
          <div style={{
            background: 'rgba(18, 18, 28, 0.95)',
            color: 'white',
            padding: '16px',
            borderRadius: '14px',
            fontFamily: 'sans-serif',
            width: '250px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            border: '2px solid #4a7c59',
            textAlign: 'center',
          }}>
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#4a7c59', fontWeight: 'bold' }}>🎶 TOCADISCOS</span>
              <button
                onClick={() => setMostrarMenu(false)}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}
              >✕</button>
            </div>

            {/* Indicador de estado */}
            <div style={{
              background: reproduciendo ? 'rgba(74,124,89,0.3)' : 'rgba(80,80,80,0.3)',
              borderRadius: '6px',
              padding: '6px',
              marginBottom: '10px',
            }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#aaa' }}>
                {reproduciendo ? '▶ REPRODUCIENDO' : '⏸ EN PAUSA'}
              </p>
              <h4 style={{
                margin: '4px 0 0',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: '#fff',
              }}>
                {LISTA_CANCIONES[cancionActualIndex].nombre}
              </h4>
            </div>

            {/* Lista de canciones — click directo para reproducir */}
            <div style={{ marginBottom: '12px', textAlign: 'left' }}>
              {LISTA_CANCIONES.map((cancion, idx) => {
                const esActual = idx === cancionActualIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => seleccionarCancion(idx)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: esActual ? '#7fffb0' : '#bbb',
                      background: esActual ? 'rgba(74,124,89,0.25)' : 'rgba(255,255,255,0.04)',
                      marginBottom: '3px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background 0.15s',
                      border: esActual ? '1px solid rgba(127,255,176,0.3)' : '1px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: '9px', opacity: 0.7 }}>
                      {esActual ? '▶' : '○'}
                    </span>
                    {cancion.nombre}
                  </div>
                );
              })}
            </div>

            {/* Controles Play/Pausa y Siguiente */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={togglePlayPausa}
                style={{
                  flex: 1,
                  background: reproduciendo
                    ? 'linear-gradient(135deg,#d9534f,#c0392b)'
                    : 'linear-gradient(135deg,#4a7c59,#2d7d46)',
                  color: 'white',
                  border: 'none',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                {reproduciendo ? '⏸ PAUSAR' : '▶ PLAY'}
              </button>
              <button
                onClick={siguienteCancion}
                style={{
                  background: '#2a2a3a',
                  color: 'white',
                  border: '1px solid #555',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                ⏭
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
