'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import { Html, Text } from '@react-three/drei';
import { Object3D, Vector3, Mesh, Group } from 'three';
import { triggerHaptic, XRHapticState } from './ControlesVideojuego';

interface PelotaProps {
  scene: Object3D;
  animando: boolean;
  setAnimando: (v: boolean) => void;
}

type Modo = 'espera' | 'vuelo' | 'agarrada';

const GRAVEDAD    = -9.8;
const ELASTICIDAD = 0.55;
const FRICCION    = 0.85;
const SUELO_Y     = 0.25;
const DIST_AGARRE = 0.45;

export default function Pelota({ scene, animando, setAnimando }: PelotaProps) {
  const pelotaRef      = useRef<Mesh | null>(null);
  const velocidadRef   = useRef(new Vector3());
  const modoRef        = useRef<Modo>('espera');
  const indiceCtrlRef  = useRef<number | null>(null);
  const posCtrlPrevRef = useRef(new Vector3());
  const velCtrlRef     = useRef(new Vector3());
  const hintVRRef      = useRef<Group>(null);

  const xr   = useXR() as XRHapticState;
  const isVR = useXR((s) => Boolean(s.session));

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

  useFrame((state, delta) => {
    if (!pelotaRef.current) return;

    const xrManager = state.gl.xr;
    const session   = xrManager.getSession();

    // ── Hint VR: sigue a la pelota ──────────────────────────────
    if (hintVRRef.current) {
      const enEspera = modoRef.current === 'espera';
      hintVRRef.current.visible = enEspera;
      if (enEspera) {
        hintVRRef.current.position.set(
          pelotaRef.current.position.x,
          pelotaRef.current.position.y + 0.5,
          pelotaRef.current.position.z,
        );
      }
    }

    // ── Grab / throw VR ─────────────────────────────────────────
    if (session) {
      const inputSources = [...session.inputSources];

      if (modoRef.current === 'agarrada' && indiceCtrlRef.current !== null) {
        const grip      = xrManager.getControllerGrip(indiceCtrlRef.current);
        const posActual = new Vector3();
        grip.getWorldPosition(posActual);

        // Velocidad del controlador este frame
        velCtrlRef.current
          .subVectors(posActual, posCtrlPrevRef.current)
          .divideScalar(Math.max(delta, 0.001));
        posCtrlPrevRef.current.copy(posActual);

        pelotaRef.current.position.copy(posActual);

        // Soltar: ningún botón presionado
        const src        = inputSources[indiceCtrlRef.current];
        const gripBtn    = src?.gamepad?.buttons[1];
        const triggerBtn = src?.gamepad?.buttons[0];
        if (!gripBtn?.pressed && !triggerBtn?.pressed) {
          velocidadRef.current.copy(velCtrlRef.current).multiplyScalar(1.8);
          // Asegurar al menos un leve arco hacia arriba si se suelta quieto
          if (velocidadRef.current.lengthSq() < 1) {
            velocidadRef.current.set(0, 3, -4);
          }
          modoRef.current = 'vuelo';
          indiceCtrlRef.current = null;
          setAnimando(true);
          triggerHaptic(xr, 'right', 0.5, 80);
        }
        return; // saltar física mientras está agarrada
      }

      // Detectar agarre cuando la pelota está quieta
      if (modoRef.current === 'espera') {
        for (let i = 0; i < inputSources.length; i++) {
          const src        = inputSources[i];
          const gripBtn    = src?.gamepad?.buttons[1];
          const triggerBtn = src?.gamepad?.buttons[0];
          if (!gripBtn?.pressed && !triggerBtn?.pressed) continue;

          const grip    = xrManager.getControllerGrip(i);
          const posCtrl = new Vector3();
          grip.getWorldPosition(posCtrl);

          if (pelotaRef.current.position.distanceTo(posCtrl) < DIST_AGARRE) {
            modoRef.current = 'agarrada';
            indiceCtrlRef.current = i;
            posCtrlPrevRef.current.copy(posCtrl);
            velCtrlRef.current.set(0, 0, 0);
            triggerHaptic(xr, 'both', 0.6, 60);
            return;
          }
        }
      }
    }

    // ── Física (solo cuando no está agarrada) ───────────────────
    if (modoRef.current === 'espera') return;

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
      {/* Esfera invisible de clic (PC) */}
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

      {/* Hint PC */}
      {pelotaRef.current && modoRef.current === 'espera' && !isVR && (
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

      {/* Hint VR — posición actualizada en useFrame */}
      {isVR && (
        <group ref={hintVRRef}>
          <mesh>
            <planeGeometry args={[0.72, 0.09]} />
            <meshBasicMaterial color="#141428" transparent opacity={0.85} />
          </mesh>
          <Text fontSize={0.030} color="white" anchorX="center" anchorY="middle" position={[0, 0, 0.001]}>
            Acercate y aprieta el gatillo para agarrar la pelota
          </Text>
        </group>
      )}
    </group>
  );
}
