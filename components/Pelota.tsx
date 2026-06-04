'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import { Html } from '@react-three/drei';
import { Object3D, Vector3, Mesh } from 'three';
import { triggerHaptic } from './ControlesVideojuego';

interface PelotaProps {
  scene: Object3D;
  animando: boolean;
  setAnimando: (v: boolean) => void;
}

type Modo = 'espera' | 'vuelo' | 'rebote';

const GRAVEDAD    = -9.8;
const ELASTICIDAD = 0.55;
const FRICCION    = 0.85;
const SUELO_Y     = 0.25;

export default function Pelota({ scene, animando, setAnimando }: PelotaProps) {
  const pelotaRef   = useRef<Mesh | null>(null);
  const velocidadRef = useRef(new Vector3());
  const modoRef     = useRef<Modo>('espera');

  // ✅ Cast explícito — mismo tipo que acepta triggerHaptic
  const xr = useXR() as { isPresenting: boolean; session: XRSession | null };

  useEffect(() => {
    if (!scene) return;
    const pelota =
      scene.getObjectByName('ball') ||
      scene.getObjectByName('pelota') ||
      scene.getObjectByName('sphere');
    if (pelota) pelotaRef.current = pelota as Mesh;
  }, [scene]);

  const lanzarPelota = () => {
    if (modoRef.current !== 'espera' || !pelotaRef.current) return;
    setAnimando(true);
    modoRef.current = 'vuelo';
    velocidadRef.current.set((Math.random() - 0.5) * 5, 6, -7);
    triggerHaptic(xr, 'right', 0.5, 120);
  };

  useFrame((_, delta) => {
    if (!pelotaRef.current || modoRef.current === 'espera') return;

    const p   = pelotaRef.current.position;
    const vel = velocidadRef.current;

    vel.y += GRAVEDAD * delta;
    p.x   += vel.x * delta;
    p.y   += vel.y * delta;
    p.z   += vel.z * delta;

    if (p.y <= SUELO_Y) {
      p.y    = SUELO_Y;
      vel.y  = -vel.y * ELASTICIDAD;
      vel.x *= FRICCION;
      vel.z *= FRICCION;

      if (Math.abs(vel.y) > 0.5) {
        triggerHaptic(xr, 'both', 0.3, 40);
      }

      if (Math.abs(vel.y) < 0.2 && vel.lengthSq() < 0.2) {
        modoRef.current = 'espera';
        setAnimando(false);
      }
    }

    pelotaRef.current.rotation.x += vel.z * delta * 1.5;
    pelotaRef.current.rotation.z -= vel.x * delta * 1.5;
  });

  return (
    <group>
      {pelotaRef.current && (
        <mesh
          position={[
            pelotaRef.current.position.x,
            pelotaRef.current.position.y,
            pelotaRef.current.position.z,
          ]}
          onClick={lanzarPelota}
        >
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {pelotaRef.current && modoRef.current === 'espera' && (
        <Html
          position={[
            pelotaRef.current.position.x,
            pelotaRef.current.position.y + 0.65,
            pelotaRef.current.position.z,
          ]}
          center
          distanceFactor={2.5}
        >
          <div style={{
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            🔴 Haz clic para lanzar la pelota
          </div>
        </Html>
      )}
    </group>
  );
}