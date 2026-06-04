'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D } from 'three';
import { Html, Text } from '@react-three/drei';
import { useXR } from '@react-three/xr';
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

  const isVR = useXR((s) => Boolean(s.session));

  useEffect(() => {
    if (!scene) return;
    const disco =
      scene.getObjectByName('LP')           ||
      scene.getObjectByName('record')       ||
      scene.getObjectByName('record_plate') ||
      scene.getObjectByName('disco');
    if (disco) discoRef.current = disco;

    const mueble =
      scene.getObjectByName('Mill_Opera_Housing') ||
      scene.getObjectByName('gramophone')         ||
      scene.getObjectByName('tocadiscos')         ||
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
    : [-3.17, 1.67, -6.43];

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
      {!mostrarMenu && !isVR && (
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
      {mostrarMenu && !isVR && (
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
      {/* ── PANEL 3D VR — sustituye Html en modo inmersivo ── */}
      {isVR && (
        <group position={[posBase[0], posBase[1] + 0.65, posBase[2] + 0.25]}>

          {/* Hint tocadiscos cerrado */}
          {!mostrarMenu && (
            <group position={[0, 0.1, 0]}>
              <mesh>
                <planeGeometry args={[0.72, 0.1]} />
                <meshBasicMaterial color="#141428" transparent opacity={0.85} />
              </mesh>
              <Text fontSize={0.034} color="white" anchorX="center" anchorY="middle" position={[0, 0, 0.001]}>
                Apunta el tocadiscos y presiona el gatillo
              </Text>
            </group>
          )}

          {/* Panel principal abierto */}
          {mostrarMenu && (
            <group position={[0, 0, 0]}>
              {/* Borde */}
              <mesh position={[0, 0.15, -0.003]}>
                <planeGeometry args={[0.72, 0.76]} />
                <meshBasicMaterial color="#4a7c59" />
              </mesh>
              {/* Fondo */}
              <mesh position={[0, 0.15, -0.002]}>
                <planeGeometry args={[0.70, 0.74]} />
                <meshBasicMaterial color="#12121c" transparent opacity={0.97} />
              </mesh>

              {/* Título */}
              <Text fontSize={0.04} color="#4a7c59" anchorX="center" anchorY="middle" position={[0, 0.5, 0.001]} fontWeight="bold">
                TOCADISCOS
              </Text>

              {/* Estado + canción actual */}
              <Text fontSize={0.028} color="#aaa" anchorX="center" anchorY="middle" position={[0, 0.44, 0.001]}>
                {reproduciendo ? 'REPRODUCIENDO' : 'EN PAUSA'}
              </Text>
              <Text fontSize={0.032} color="white" anchorX="center" anchorY="middle" position={[0, 0.38, 0.001]} maxWidth={0.62} textAlign="center">
                {LISTA_CANCIONES[cancionActualIndex].nombre}
              </Text>

              {/* Botón Play/Pausa */}
              <mesh
                position={[-0.15, 0.26, 0.001]}
                onClick={(e) => { e.stopPropagation(); togglePlayPausa(); }}
              >
                <planeGeometry args={[0.26, 0.1]} />
                <meshBasicMaterial color={reproduciendo ? '#c0392b' : '#4a7c59'} />
              </mesh>
              <Text fontSize={0.036} color="white" anchorX="center" anchorY="middle" position={[-0.15, 0.26, 0.002]}>
                {reproduciendo ? 'PAUSAR' : 'PLAY'}
              </Text>

              {/* Botón Siguiente */}
              <mesh
                position={[0.18, 0.26, 0.001]}
                onClick={(e) => { e.stopPropagation(); siguienteCancion(); }}
              >
                <planeGeometry args={[0.22, 0.1]} />
                <meshBasicMaterial color="#2a2a3a" />
              </mesh>
              <Text fontSize={0.034} color="white" anchorX="center" anchorY="middle" position={[0.18, 0.26, 0.002]}>
                SIGUIENTE
              </Text>

              {/* Lista canciones (solo nombres, sin interacción) */}
              {LISTA_CANCIONES.map((cancion, idx) => {
                const esActual = idx === cancionActualIndex;
                return (
                  <group key={idx} position={[0, 0.16 - idx * 0.075, 0.001]}>
                    <mesh
                      onClick={(e) => { e.stopPropagation(); seleccionarCancion(idx); }}
                    >
                      <planeGeometry args={[0.62, 0.065]} />
                      <meshBasicMaterial
                        color={esActual ? 'rgba(74,124,89,0.4)' : 'rgba(255,255,255,0.04)'}
                        transparent
                        opacity={esActual ? 0.6 : 0.15}
                      />
                    </mesh>
                    <Text
                      fontSize={0.026}
                      color={esActual ? '#7fffb0' : '#bbb'}
                      anchorX="center"
                      anchorY="middle"
                      position={[0, 0, 0.001]}
                      maxWidth={0.58}
                    >
                      {`${esActual ? '▶ ' : '○ '}${cancion.nombre}`}
                    </Text>
                  </group>
                );
              })}

              {/* Botón cerrar */}
              <mesh
                position={[0, -0.14, 0.001]}
                onClick={(e) => { e.stopPropagation(); setMostrarMenu(false); }}
              >
                <planeGeometry args={[0.3, 0.09]} />
                <meshBasicMaterial color="#555" />
              </mesh>
              <Text fontSize={0.034} color="white" anchorX="center" anchorY="middle" position={[0, -0.14, 0.002]}>
                Cerrar
              </Text>
            </group>
          )}

        </group>
      )}

    </group>
  );
}
