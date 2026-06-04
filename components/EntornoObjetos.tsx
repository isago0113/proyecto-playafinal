'use client';

import { useMemo } from 'react';
import { Object3D } from 'three';
import { SOLID_BOUNDS, WALKABLE_ZONES } from './collisionConfig';

interface EntornoObjetosProps {
  scene: Object3D;
}

/**
 * Genera planos y cajas de colisión invisibles para:
 *  - Suelo caminable (planos planos a la Y correcta de cada zona)
 *  - Límites sólidos (paredes, mesas, rocas)
 *
 * NO usa TeleportTarget: ese componente causa InvalidStateError en XR
 * cuando la sesión aún no está completamente inicializada.
 * La locomoción continua por joystick maneja el movimiento sin teletransporte.
 */
export default function EntornoObjetos({ scene }: EntornoObjetosProps) {
  const zonas   = useMemo(() => WALKABLE_ZONES, []);
  const limites = useMemo(() => SOLID_BOUNDS, []);
  void scene;

  return (
    <group name="capas-fisicas-limites">

      {/* ── SUELO CAMINABLE ── planos horizontales invisibles por zona ── */}
      {zonas.map((zone) => (
        <mesh
          key={zone.id}
          receiveShadow
          position={[
            (zone.minX + zone.maxX) / 2,
            zone.y,
            (zone.minZ + zone.maxZ) / 2,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[zone.maxX - zone.minX, zone.maxZ - zone.minZ]} />
          {/*
           * opacity 0 → invisible para el usuario
           * depthWrite false → no interfiere con el render del GLB
           * El mesh sigue siendo "golpeable" por raycasts del puntero de VR
           */}
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}

      {/* ── LÍMITES SÓLIDOS ── cajas invisibles (paredes, mesas, rocas) ── */}
      {limites.map((bound) => (
        <mesh
          key={bound.id}
          position={[
            (bound.minX + bound.maxX) / 2,
            (bound.minY + bound.maxY) / 2,
            (bound.minZ + bound.maxZ) / 2,
          ]}
        >
          <boxGeometry
            args={[
              bound.maxX - bound.minX,
              bound.maxY - bound.minY,
              bound.maxZ - bound.minZ,
            ]}
          />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}