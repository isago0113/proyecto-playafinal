'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import { PointLight, Object3D, Mesh } from 'three';
import { triggerHaptic } from './ControlesVideojuego';

interface VelaProps {
  scene: Object3D;
  encendida: boolean;
}

interface XRHapticState {
  isPresenting: boolean;
  session: XRSession | null;
}

export default function Vela({ scene, encendida }: VelaProps) {
  const luzRef   = useRef<PointLight>(null);
  const llamaRef = useRef<Mesh | null>(null);

  const xr = useXR() as XRHapticState;

  const [posicionLuz, setPosicionLuz] = useState<[number, number, number]>([-0.4, 1.25, -1.6]);

  useEffect(() => {
    if (!scene) return;
    const llama =
      scene.getObjectByName('flame')        ||
      scene.getObjectByName('llama')        ||
      scene.getObjectByName('candle_light');
    if (llama) {
      llamaRef.current = llama as Mesh;
      setPosicionLuz([llama.position.x, llama.position.y + 0.05, llama.position.z]);
    }
  }, [scene]);

  // Feedback háptico al cambiar estado
  useEffect(() => {
    triggerHaptic(xr, 'both', 0.6, 60);
  }, [encendida]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animación de llama (parpadeo suave)
  useFrame((state) => {
    if (!llamaRef.current) return;
    llamaRef.current.visible = encendida;
    if (luzRef.current) {
      if (encendida) {
        const t = state.clock.getElapsedTime();
        // Parpadeo de la intensidad para simular llama real
        luzRef.current.intensity = 1.6 + Math.sin(t * 13) * 0.25 + Math.sin(t * 7.3) * 0.1;
      } else {
        luzRef.current.intensity = 0;
      }
    }
    if (encendida) {
      const t = state.clock.getElapsedTime();
      const factor = Math.sin(t * 15) * 0.08 + 1;
      llamaRef.current.scale.set(factor, factor, factor);
    }
  });

  return (
    <group name="componente-vela">
      {/*
       * pointLight color #ff6a00 (naranja cálido profundo) según spec del proyecto
       * intensity controlada por useFrame para efecto parpadeo
       * distance 4m, decay cuadrático estándar
       */}
      <pointLight
        ref={luzRef}
        position={posicionLuz}
        color="#ff6a00"
        intensity={encendida ? 1.8 : 0}
        distance={4}
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
    </group>
  );
}