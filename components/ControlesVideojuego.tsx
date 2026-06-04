'use client';

import { useRef, useEffect, RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR, useXRInputSourceState } from '@react-three/xr';
import { Vector3, Group } from 'three';
import type { SolidBound, WalkableZone } from './collisionConfig';

interface XRHapticState {
  isPresenting: boolean;
  session: XRSession | null;
}

export const triggerHaptic = (
  xr: XRHapticState,
  handedness: 'left' | 'right' | 'both',
  intensity: number,
  duration: number
) => {
  if (!xr.isPresenting || !xr.session) return;
  for (const source of Array.from(xr.session.inputSources)) {
    if (handedness !== 'both' && source.handedness !== handedness) continue;
    const actuators = source.gamepad?.hapticActuators;
    if (actuators?.length) {
      (actuators[0] as any).pulse(intensity, duration);
    }
  }
};

interface ControlesProps {
  activo: boolean;
  uiInteractivaActiva: boolean;
  walkableMeshes: any[];
  obstacleMeshes: any[];
  walkableZones: WalkableZone[];
  solidBounds: SolidBound[];
  playerGroupRef?: RefObject<Group | null>;
  onDebugData?: (data: {
    x: number; y: number; z: number;
    groundY: number; zoneId: string | null;
  }) => void;
}

const WALK_SPEED      = 3.5;
const PLAYER_EYE_HEIGHT = 1.6;

export default function ControlesVideojuego({
  activo,
  uiInteractivaActiva,
  walkableZones,
  solidBounds,
  playerGroupRef,
  onDebugData,
}: ControlesProps) {
  const { camera } = useThree();
  const isPresenting = useXR((s) => s.isPresenting);
  const leftController = useXRInputSourceState('controller', 'left');

  const teclasRef        = useRef<Record<string, boolean>>({});
  const moveVectorRef    = useRef(new Vector3());
  const forwardVectorRef = useRef(new Vector3());
  const rightVectorRef   = useRef(new Vector3());

  useEffect(() => {
    const presionar = (e: KeyboardEvent) => { teclasRef.current[e.key.toLowerCase()] = true; };
    const soltar    = (e: KeyboardEvent) => { teclasRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', presionar);
    window.addEventListener('keyup',   soltar);
    return () => {
      window.removeEventListener('keydown', presionar);
      window.removeEventListener('keyup',   soltar);
    };
  }, []);

  const colisiona = (x: number, z: number): boolean => {
    for (const b of solidBounds) {
      if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return true;
    }
    return false;
  };

  const inZone = (x: number, z: number, zone: WalkableZone): boolean =>
    x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ;

  const alturaZona = (x: number, z: number): number => {
    for (const zone of walkableZones) {
      if (inZone(x, z, zone)) return zone.y;
    }
    return 0;
  };

  useFrame((_, delta) => {

    // ══════════════════════════════════════════════════════════════════════
    // 🥽 MODO VR — joystick izquierdo via useXRInputSourceState (API v6)
    // ══════════════════════════════════════════════════════════════════════
    if (isPresenting) {
      const group = playerGroupRef?.current;
      if (!group) return;

      const thumbstick = leftController?.gamepad['xr-standard-thumbstick'];
      const axisX = thumbstick?.xAxis ?? 0;
      const axisZ = thumbstick?.yAxis ?? 0;

      const deadzone = 0.15;
      const moverX = Math.abs(axisX) > deadzone;
      const moverZ = Math.abs(axisZ) > deadzone;

      if (moverX || moverZ) {
        // Dirección de movimiento según hacia dónde mira la cabeza (cámara = HMD)
        camera.getWorldDirection(forwardVectorRef.current);
        forwardVectorRef.current.y = 0;
        if (forwardVectorRef.current.lengthSq() > 0.001) {
          forwardVectorRef.current.normalize();
        }
        // Vector derecha = forward × up  (producto cruzado correcto)
        rightVectorRef.current.crossVectors(forwardVectorRef.current, new Vector3(0, 1, 0));

        moveVectorRef.current.set(0, 0, 0);
        // axisZ negativo al empujar adelante → negamos para avanzar
        if (moverZ) moveVectorRef.current.addScaledVector(forwardVectorRef.current, -axisZ);
        if (moverX) moveVectorRef.current.addScaledVector(rightVectorRef.current,    axisX);

        if (moveVectorRef.current.lengthSq() > 0) {
          moveVectorRef.current.normalize().multiplyScalar(WALK_SPEED * delta);
          const nextX = group.position.x + moveVectorRef.current.x;
          const nextZ = group.position.z + moveVectorRef.current.z;
          if (!colisiona(nextX, nextZ)) {
            group.position.x = nextX;
            group.position.z = nextZ;
          }
        }
      }

      // Ajustar altura del grupo según la zona caminable (subir/bajar el muelle con suavidad)
      const targetY = alturaZona(group.position.x, group.position.z);
      group.position.y += (targetY - group.position.y) * Math.min(delta * 8, 1);
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 💻 MODO PC — WASD / flechas
    // ══════════════════════════════════════════════════════════════════════
    if (!activo || uiInteractivaActiva) return;

    moveVectorRef.current.set(0, 0, 0);
    const t = teclasRef.current;

    forwardVectorRef.current
      .set(0, 0, -1)
      .applyAxisAngle(new Vector3(0, 1, 0), camera.rotation.y);
    rightVectorRef.current
      .set(1, 0, 0)
      .applyAxisAngle(new Vector3(0, 1, 0), camera.rotation.y);

    if (t['w'] || t['arrowup'])    moveVectorRef.current.add(forwardVectorRef.current);
    if (t['s'] || t['arrowdown'])  moveVectorRef.current.sub(forwardVectorRef.current);
    if (t['d'] || t['arrowright']) moveVectorRef.current.add(rightVectorRef.current);
    if (t['a'] || t['arrowleft'])  moveVectorRef.current.sub(rightVectorRef.current);

    if (moveVectorRef.current.lengthSq() > 0) {
      moveVectorRef.current.normalize().multiplyScalar(WALK_SPEED * delta);
      const nx = camera.position.x + moveVectorRef.current.x;
      const nz = camera.position.z + moveVectorRef.current.z;
      if (!colisiona(nx, nz)) {
        camera.position.x = nx;
        camera.position.z = nz;
      }
    }

    let groundY = 0;
    let currentZoneId: string | null = null;
    for (const zone of walkableZones) {
      if (inZone(camera.position.x, camera.position.z, zone)) {
        groundY = zone.y;
        currentZoneId = zone.id;
        break;
      }
    }
    camera.position.y = groundY + PLAYER_EYE_HEIGHT;

    onDebugData?.({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      groundY,
      zoneId: currentZoneId,
    });
  });

  return null;
}
