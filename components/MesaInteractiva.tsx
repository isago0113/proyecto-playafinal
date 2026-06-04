'use client';

import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { useXR } from '@react-three/xr';
import { Object3D, Group } from 'three';
import Vela from './Vela';
import { upsertEmotionalLetter } from './sessionStore';

interface MesaInteractivaProps {
  scene: Object3D;
  studentId: string;
}

type EstadoMariposa = 'volando' | 'posada';

export default function MesaInteractiva({ scene, studentId }: MesaInteractivaProps) {
  const [menuAbierto,     setMenuAbierto]     = useState(false);
  const [velaEncendida,   setVelaEncendida]   = useState(false);
  const [textoCarta,      setTextoCarta]      = useState('');
  const [guardado,        setGuardado]        = useState(false);
  const [estadoMariposa,  setEstadoMariposa]  = useState<EstadoMariposa>('volando');

  const isVR = useXR((s) => Boolean(s.session));

  const mesaRef     = useRef<Object3D | null>(null);
  const mariposRef  = useRef<Group>(null);

  useEffect(() => {
    if (!scene) return;
    const mesa =
      scene.getObjectByName('Cube001') ||
      scene.getObjectByName('table')   ||
      scene.getObjectByName('mesa')    ||
      scene.getObjectByName('desk');
    if (mesa) mesaRef.current = mesa;
  }, [scene]);

  // Posición base de la mesa (fallback si el GLB no tiene el objeto nombrado)
  const posMesa: [number, number, number] = mesaRef.current
    ? [mesaRef.current.position.x, mesaRef.current.position.y, mesaRef.current.position.z]
    : [1.8, 1.45, -6.87];

  // Posición del socket (sobre la superficie de la mesa)
  const posSocket: [number, number, number] = [
    posMesa[0] + 0.18,
    posMesa[1] + 0.87,
    posMesa[2] + 0.12,
  ];

  // Animación de la mariposa — siempre vuela si está en estado 'volando'
  useFrame(({ clock }) => {
    if (!mariposRef.current) return;
    if (estadoMariposa === 'posada') return;

    const t = clock.getElapsedTime();
    // Figura 8 alrededor de la mesa
    mariposRef.current.position.x = posMesa[0] - 0.3 + Math.sin(t * 1.2) * 0.35;
    mariposRef.current.position.y = posMesa[1] + 0.9 + Math.sin(t * 2.4) * 0.09;
    mariposRef.current.position.z = posMesa[2]        + Math.sin(t * 0.6) * 0.25;
    // Aleteo
    const aleteo = 0.9 + Math.abs(Math.sin(t * 8)) * 0.3;
    mariposRef.current.scale.set(1, aleteo, 1);
    mariposRef.current.rotation.y = Math.sin(t * 1.2) * 0.5;
  });

  const guardarCarta = () => {
    if (!textoCarta.trim()) return;
    try {
      upsertEmotionalLetter(studentId, textoCarta);
      setTextoCarta('');
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (e) {
      console.error('Error guardando carta:', e);
    }
  };

  const toggleMariposa = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setEstadoMariposa((prev) => (prev === 'volando' ? 'posada' : 'volando'));
  };

  return (
    <group name="mesa-interactiva">

      {/* ── Vela con pointLight naranja cálido ── */}
      <Vela scene={scene} encendida={velaEncendida} />

      {/* ── SOCKET VISUAL: anillo en la mesa que muestra dónde puede posarse la mariposa ── */}
      <mesh
        position={posSocket}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.055, 0.085, 32]} />
        <meshBasicMaterial
          color={estadoMariposa === 'posada' ? '#f9a825' : '#ffd6a3'}
          transparent
          opacity={estadoMariposa === 'posada' ? 0.95 : 0.5}
          depthWrite={false}
        />
      </mesh>

      {/* ── MARIPOSA — siempre presente, independiente de la vela ── */}
      <group
        ref={mariposRef}
        position={estadoMariposa === 'posada' ? posSocket : posMesa}
        onClick={toggleMariposa}
      >
        {/* Cuerpo */}
        <mesh>
          <capsuleGeometry args={[0.015, 0.06, 4, 8]} />
          <meshStandardMaterial color="#5c3d1e" />
        </mesh>
        {/* Ala izquierda */}
        <mesh position={[-0.07, 0, 0]} rotation={[0, 0, estadoMariposa === 'posada' ? 0.1 : 0.3]}>
          <sphereGeometry args={[0.07, 8, 6, 0, Math.PI]} />
          <meshStandardMaterial
            color="#f9a825"
            emissive="#ff6a00"
            emissiveIntensity={velaEncendida ? 0.7 : 0.3}
            transparent
            opacity={0.88}
            side={2}
          />
        </mesh>
        {/* Ala derecha */}
        <mesh position={[0.07, 0, 0]} rotation={[0, 0, estadoMariposa === 'posada' ? -0.1 : -0.3]}>
          <sphereGeometry args={[0.07, 8, 6, 0, Math.PI]} />
          <meshStandardMaterial
            color="#f9a825"
            emissive="#ff6a00"
            emissiveIntensity={velaEncendida ? 0.7 : 0.3}
            transparent
            opacity={0.88}
            side={2}
          />
        </mesh>

        {/* Zona de clic ampliada — invisible, cubre toda la mariposa */}
        <mesh>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Mensaje de calma — solo con vela encendida */}
        {velaEncendida && !isVR && (
          <Html position={[0, 0.18, 0]} center distanceFactor={3}>
            <div style={{
              background: 'rgba(255,200,80,0.9)',
              color: '#3d2000',
              padding: '3px 8px',
              borderRadius: '8px',
              fontSize: '9px',
              whiteSpace: 'nowrap',
              fontFamily: 'serif',
              pointerEvents: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}>
              🦋 Respira... estás a salvo
            </div>
          </Html>
        )}
      </group>

      {/* ── HINT DE INTERACCIÓN CON LA MARIPOSA (siempre visible, contextual) ── */}
      {!isVR && <Html
        position={[posMesa[0] - 0.3, posMesa[1] + 1.3, posMesa[2]]}
        center
        distanceFactor={3}
      >
        <div style={{
          background: estadoMariposa === 'posada'
            ? 'rgba(249,168,37,0.92)'
            : 'rgba(20,20,40,0.85)',
          color: estadoMariposa === 'posada' ? '#3d2000' : '#ffd6a3',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '9px',
          whiteSpace: 'nowrap',
          fontFamily: 'sans-serif',
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          border: estadoMariposa === 'posada'
            ? '1px solid rgba(255,160,0,0.6)'
            : '1px solid rgba(255,214,163,0.3)',
          transition: 'all 0.3s',
        }}>
          {estadoMariposa === 'posada'
            ? '🦋 Toca la mariposa para liberarla'
            : '🦋 Toca la mariposa para agarrarla'}
        </div>
      </Html>}

      {/* ── Caja de click invisible sobre la mesa (abre/cierra el menú) ── */}
      <mesh
        position={[posMesa[0], posMesa[1] + 0.55, posMesa[2]]}
        onClick={(e) => { e.stopPropagation(); setMenuAbierto((v) => !v); }}
      >
        <boxGeometry args={[0.8, 0.5, 0.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* ── Hint de la mesa cuando el menú está cerrado ── */}
      {!menuAbierto && !isVR && (
        <Html
          position={[posMesa[0], posMesa[1] + 1.05, posMesa[2]]}
          center
          distanceFactor={3}
        >
          <div style={{
            background: 'rgba(0,0,0,0.75)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            🧘 Clic para abrir la mesa
          </div>
        </Html>
      )}

      {/* ── MENÚ PRINCIPAL DE LA MESA ── */}
      {menuAbierto && !isVR && (
        <Html
          position={[posMesa[0], posMesa[1] + 0.9, posMesa[2]]}
          transform
          distanceFactor={1.1}
          rotation={[0, 0, 0]}
        >
          <div style={{
            background: '#fdf6e2',
            padding: '16px',
            borderRadius: '12px',
            width: '270px',
            fontFamily: 'serif',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '2px solid #d4a84b',
            position: 'relative',
          }}>
            {/* Título */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#3d2000', fontSize: '13px' }}>
                🧘 Mesa Psicológica
              </h4>
              <button
                onClick={() => setMenuAbierto(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#888' }}
              >✕</button>
            </div>

            <p style={{ margin: '0 0 10px', fontSize: '10px', color: '#666' }}>
              Sesión: <strong style={{ color: '#4a7c59' }}>{studentId}</strong>
            </p>

            {/* ── CONTROL LUMÍNICO ── */}
            <div style={{
              background: velaEncendida ? 'rgba(255,106,0,0.12)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${velaEncendida ? '#ff6a00' : '#ccc'}`,
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '10px',
              transition: 'all 0.3s',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 'bold', color: '#444' }}>
                💡 Control Lumínico
              </p>
              <button
                onClick={() => setVelaEncendida((v) => !v)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: velaEncendida
                    ? 'linear-gradient(135deg,#ff6a00,#ee0979)'
                    : '#555',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background 0.3s',
                }}
              >
                {velaEncendida ? '🕯️ Apagar vela' : '🕯️ Encender vela'}
              </button>
              {velaEncendida && (
                <p style={{ margin: '6px 0 0', fontSize: '9px', color: '#ff6a00', textAlign: 'center' }}>
                  ✨ Luz cálida activa
                </p>
              )}
            </div>

            {/* ── BITÁCORA EMOCIONAL ── */}
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid #e1d7bc',
              borderRadius: '8px',
              padding: '10px',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 'bold', color: '#444' }}>
                ✍️ Carta Sentimental
              </p>
              <textarea
                value={textoCarta}
                onChange={(e) => setTextoCarta(e.target.value)}
                placeholder="Escribe aquello que sientes, lo que deseas dejar ir..."
                style={{
                  width: '90%',
                  height: '85px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                  fontSize: '11px',
                  resize: 'none',
                  fontFamily: 'Georgia, serif',
                  display: 'block',
                  marginBottom: '6px',
                  lineHeight: '1.5',
                }}
              />
              <button
                onClick={guardarCarta}
                style={{
                  width: '100%',
                  padding: '7px',
                  borderRadius: '5px',
                  border: 'none',
                  background: guardado ? '#2d7d46' : '#4a7c59',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background 0.3s',
                }}
              >
                {guardado ? '✅ Carta guardada' : '💾 Guardar carta'}
              </button>
            </div>
          </div>
        </Html>
      )}
      {/* ── PANEL 3D VR — sustituye Html en modo inmersivo ── */}
      {isVR && (
        <group position={[posMesa[0] + 0.25, posMesa[1] + 0.65, posMesa[2] + 0.25]}>

          {/* Hint mariposa — siempre visible en VR */}
          <group position={[0, 0.72, 0]}>
            <mesh>
              <planeGeometry args={[0.72, 0.1]} />
              <meshBasicMaterial color={estadoMariposa === 'posada' ? '#f9a825' : '#141428'} transparent opacity={0.88} />
            </mesh>
            <Text fontSize={0.038} color={estadoMariposa === 'posada' ? '#3d2000' : '#ffd6a3'} anchorX="center" anchorY="middle" position={[0, 0, 0.001]}>
              {estadoMariposa === 'posada' ? 'Apunta la mariposa y presiona el gatillo para liberarla' : 'Apunta la mariposa y presiona el gatillo para agarrarla'}
            </Text>
          </group>

          {/* Mensaje calma — solo con vela */}
          {velaEncendida && (
            <group position={[0, 0.58, 0]}>
              <mesh>
                <planeGeometry args={[0.55, 0.09]} />
                <meshBasicMaterial color="#ffc850" transparent opacity={0.9} />
              </mesh>
              <Text fontSize={0.036} color="#3d2000" anchorX="center" anchorY="middle" position={[0, 0, 0.001]}>
                Respira... estas a salvo
              </Text>
            </group>
          )}

          {/* Hint mesa cerrada */}
          {!menuAbierto && (
            <group position={[0, 0.44, 0]}>
              <mesh>
                <planeGeometry args={[0.62, 0.09]} />
                <meshBasicMaterial color="#141428" transparent opacity={0.82} />
              </mesh>
              <Text fontSize={0.034} color="white" anchorX="center" anchorY="middle" position={[0, 0, 0.001]}>
                Apunta la mesa y presiona el gatillo para abrirla
              </Text>
            </group>
          )}

          {/* Panel principal — menú abierto */}
          {menuAbierto && (
            <group position={[0, 0, 0]}>
              {/* Fondo del panel */}
              <mesh position={[0, 0.15, -0.002]}>
                <planeGeometry args={[0.68, 0.82]} />
                <meshBasicMaterial color="#fdf6e2" transparent opacity={0.97} />
              </mesh>
              {/* Borde */}
              <mesh position={[0, 0.15, -0.003]}>
                <planeGeometry args={[0.7, 0.84]} />
                <meshBasicMaterial color="#d4a84b" />
              </mesh>

              {/* Título */}
              <Text fontSize={0.045} color="#3d2000" anchorX="center" anchorY="middle" position={[0, 0.52, 0.001]} fontWeight="bold">
                Mesa Psicologica
              </Text>
              <Text fontSize={0.03} color="#4a7c59" anchorX="center" anchorY="middle" position={[0, 0.46, 0.001]}>
                {`Sesion: ${studentId}`}
              </Text>

              {/* Sección vela */}
              <Text fontSize={0.033} color="#444" anchorX="left" anchorY="middle" position={[-0.28, 0.38, 0.001]}>
                Control Luminico
              </Text>
              <mesh
                position={[0, 0.3, 0.001]}
                onClick={(e) => { e.stopPropagation(); setVelaEncendida((v) => !v); }}
              >
                <planeGeometry args={[0.52, 0.1]} />
                <meshBasicMaterial color={velaEncendida ? '#ff6a00' : '#555'} />
              </mesh>
              <Text fontSize={0.038} color="white" anchorX="center" anchorY="middle" position={[0, 0.3, 0.002]}>
                {velaEncendida ? 'Apagar vela' : 'Encender vela'}
              </Text>
              {velaEncendida && (
                <Text fontSize={0.028} color="#ff6a00" anchorX="center" anchorY="middle" position={[0, 0.22, 0.001]}>
                  Luz calida activa
                </Text>
              )}

              {/* Carta — solo disponible en PC */}
              <Text fontSize={0.03} color="#666" anchorX="center" anchorY="middle" position={[0, 0.1, 0.001]} maxWidth={0.6} textAlign="center">
                La carta sentimental esta disponible{'\n'}desde el modo PC
              </Text>

              {/* Botón cerrar */}
              <mesh
                position={[0, -0.1, 0.001]}
                onClick={(e) => { e.stopPropagation(); setMenuAbierto(false); }}
              >
                <planeGeometry args={[0.3, 0.09]} />
                <meshBasicMaterial color="#888" />
              </mesh>
              <Text fontSize={0.036} color="white" anchorX="center" anchorY="middle" position={[0, -0.1, 0.002]}>
                Cerrar
              </Text>
            </group>
          )}

        </group>
      )}

    </group>
  );
}
