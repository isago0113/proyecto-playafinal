'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import { Html, Text } from '@react-three/drei';
import { Vector3, Group } from 'three';
import { triggerHaptic, XRHapticState } from './ControlesVideojuego';

interface PelotaProps {
  animando: boolean;
  setAnimando: (v: boolean) => void;
}

type Modo = 'espera' | 'vuelo' | 'agarrada';

const GRAVEDAD    = -9.8;
const ELASTICIDAD = 0.58;
const FRICCION    = 0.88;
const RADIO       = 0.22;
const SUELO_Y     = RADIO;
const DIST_AGARRE = 0.5;
const POS_INICIAL: [number, number, number] = [3, SUELO_Y, 2.5];

export default function Pelota({ animando, setAnimando }: PelotaProps) {
  const grupoRef       = useRef<Group>(null);
  const velocidadRef   = useRef(new Vector3());
  const modoRef        = useRef<Modo>('espera');
  const indiceCtrlRef  = useRef<number | null>(null);
  const posCtrlPrevRef = useRef(new Vector3());
  const velCtrlRef     = useRef(new Vector3());
  const hintVRRef      = useRef<Group>(null);

  const xr   = useXR() as XRHapticState;
  const isVR = useXR((s) => Boolean(s.session));

  const lanzarPelota = () => {
    if (modoRef.current !== 'espera' || !grupoRef.current) return;
    setAnimando(true);
    modoRef.current = 'vuelo';
    velocidadRef.current.set((Math.random() - 0.5) * 5, 6, -7);
    triggerHaptic(xr, 'right', 0.5, 120);
  };

  useFrame((state, delta) => {
    if (!grupoRef.current) return;

    const xrManager = state.gl.xr;
    const session   = xrManager.getSession();

    // ── Hint VR: sigue la pelota ────────────────────────────────
    if (hintVRRef.current) {
      const enEspera = modoRef.current === 'espera';
      hintVRRef.current.visible = enEspera;
      if (enEspera) {
        hintVRRef.current.position.set(
          grupoRef.current.position.x,
          grupoRef.current.position.y + 0.45,
          grupoRef.current.position.z,
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

        velCtrlRef.current
          .subVectors(posActual, posCtrlPrevRef.current)
          .divideScalar(Math.max(delta, 0.001));
        posCtrlPrevRef.current.copy(posActual);
        grupoRef.current.position.copy(posActual);

        const src        = inputSources[indiceCtrlRef.current];
        const gripBtn    = src?.gamepad?.buttons[1];
        const triggerBtn = src?.gamepad?.buttons[0];
        if (!gripBtn?.pressed && !triggerBtn?.pressed) {
          velocidadRef.current.copy(velCtrlRef.current).multiplyScalar(1.8);
          if (velocidadRef.current.lengthSq() < 1) {
            velocidadRef.current.set(0, 3, -4);
          }
          modoRef.current = 'vuelo';
          indiceCtrlRef.current = null;
          setAnimando(true);
          triggerHaptic(xr, 'right', 0.5, 80);
        }
        return;
      }

      if (modoRef.current === 'espera') {
        for (let i = 0; i < inputSources.length; i++) {
          const src        = inputSources[i];
          const gripBtn    = src?.gamepad?.buttons[1];
          const triggerBtn = src?.gamepad?.buttons[0];
          if (!gripBtn?.pressed && !triggerBtn?.pressed) continue;

          const grip    = xrManager.getControllerGrip(i);
          const posCtrl = new Vector3();
          grip.getWorldPosition(posCtrl);

          if (grupoRef.current.position.distanceTo(posCtrl) < DIST_AGARRE) {
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

    // ── Física ─────────────────────────────────────────────────
    if (modoRef.current === 'espera') return;

    const p   = grupoRef.current.position;
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

      if (Math.abs(vel.y) > 0.5) triggerHaptic(xr, 'both', 0.3, 40);

      if (Math.abs(vel.y) < 0.15 && vel.lengthSq() < 0.15) {
        modoRef.current = 'espera';
        setAnimando(false);
      }
    }

    grupoRef.current.rotation.x += vel.z * delta * 1.5;
    grupoRef.current.rotation.z -= vel.x * delta * 1.5;
  });

  return (
    <group>
      {/* ── Pelota de playa ── */}
      <group ref={grupoRef} position={POS_INICIAL} onClick={lanzarPelota}>
        {/* Esfera base */}
        <mesh castShadow>
          <sphereGeometry args={[RADIO, 32, 32]} />
          <meshStandardMaterial color="#ff4c29" roughness={0.4} metalness={0.05} />
        </mesh>
        {/* Franja blanca ecuatorial */}
        <mesh>
          <torusGeometry args={[RADIO, 0.013, 8, 48]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Franja azul inclinada */}
        <mesh rotation={[Math.PI / 2.6, 0.4, 0]}>
          <torusGeometry args={[RADIO, 0.013, 8, 48]} />
          <meshStandardMaterial color="#64b5f6" roughness={0.3} />
        </mesh>
        {/* Franja amarilla opuesta */}
        <mesh rotation={[-Math.PI / 2.6, -0.4, 0]}>
          <torusGeometry args={[RADIO, 0.013, 8, 48]} />
          <meshStandardMaterial color="#fff176" roughness={0.3} />
        </mesh>
      </group>

      {/* Hint PC */}
      {!isVR && modoRef.current === 'espera' && (
        <Html
          position={[POS_INICIAL[0], POS_INICIAL[1] + 0.5, POS_INICIAL[2]]}
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
            🏐 Haz clic para lanzar la pelota
          </div>
        </Html>
      )}

      {/* Hint VR — posición actualizada por useFrame */}
      {isVR && (
        <group ref={hintVRRef}>
          <mesh>
            <planeGeometry args={[0.75, 0.09]} />
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
