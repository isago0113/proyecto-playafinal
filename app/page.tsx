'use client';

import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { useState } from 'react';
import type { StudentProfile } from '../components/sessionStore';
import ControlesVideojuego from '../components/ControlesVideojuego';
import { SOLID_BOUNDS, WALKABLE_ZONES } from '../components/collisionConfig';
import Playa from '../components/Playa'; 
import MenuBienvenida from '../components/MenuBienvenida'; 

// 🕶️ CONFIGURACIÓN CORRECTA DE WEBXR V6
// Habilitamos los mandos físicos (controller) y desactivamos el tracking de manos (hand) 
// para que Meta Quest priorice los Joysticks inmediatamente al pulsar "Entrar en VR".
const store = createXRStore({
  controller: true,
  hand: false
});

export default function Home() {
  const [perfilSesion, setPerfilSesion] = useState<StudentProfile | null>(null);
  const mostrarBienvenida = !perfilSesion;

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {!mostrarBienvenida && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          pointerEvents: 'none',
          fontFamily: 'sans-serif'
        }}>
          <h1 style={{ color: '#ff9d42', margin: 0, fontSize: '24px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Playa de Relajación
          </h1>
          <p style={{ color: 'white', margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
            {`Usuario ${perfilSesion?.studentId ?? ''}: Usa el Joystick Izquierdo de tus mandos para caminar por la playa.`}
          </p>
        </div>
      )}

      {mostrarBienvenida ? (
        <MenuBienvenida alIniciarSesion={(profile) => setPerfilSesion(profile)} />
      ) : (
        <Canvas 
          shadows 
          camera={{ position: [0, 1.6, 4], fov: 60 }}
          style={{ width: '100%', height: '100%', backgroundColor: '#111' }}
        >
          <Sky sunPosition={[60, 5, 100]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />

          {/* 🥽 ENGANCHE OBLIGATORIO DE LA TIENDA XR V6 */}
          <XR store={store}>
            <Playa studentId={perfilSesion.studentId} />
          </XR>
        </Canvas>
      )}
    </main>
  );
}