'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';

export type InteractionTarget = 'mesa' | 'tocadiscos';

export interface IndicatorPoint {
  id: InteractionTarget;
  position: [number, number, number];
}

interface InteractionIndicatorsProps {
  points: IndicatorPoint[];
  activeTarget: InteractionTarget | null;
}

export default function InteractionIndicators({ points, activeTarget }: InteractionIndicatorsProps) {
  const refs = useRef<Record<string, Group | null>>({});
  const basePositions = useMemo(() => {
    const acc: Record<string, Vector3> = {};
    for (const point of points) {
      acc[point.id] = new Vector3(point.position[0], point.position[1], point.position[2]);
    }
    return acc;
  }, [points]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    for (const point of points) {
      const group = refs.current[point.id];
      const base = basePositions[point.id];
      if (!group || !base) continue;

      const isActive = activeTarget === point.id;
      const bob = Math.sin(t * 2 + base.x) * 0.08;
      group.position.set(base.x, base.y + 0.28 + bob, base.z);
      group.rotation.y += isActive ? 0.03 : 0.012;
      group.scale.setScalar(isActive ? 1.12 : 1);
    }
  });

  return (
    <group name="interaction-indicators">
      {points.map((point) => {
        const isActive = activeTarget === point.id;
        return (
          <group
            key={point.id}
            ref={(group) => {
              refs.current[point.id] = group;
            }}
            position={point.position}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
              <ringGeometry args={[0.35, 0.5, 48]} />
              <meshBasicMaterial color={isActive ? '#58f6ff' : '#ff9d42'} transparent opacity={isActive ? 0.95 : 0.8} depthWrite={false} depthTest={false} />
            </mesh>
            <mesh position={[0, 0.78, 0]}>
              <coneGeometry args={[0.13, 0.22, 12]} />
              <meshStandardMaterial emissive={isActive ? '#58f6ff' : '#ff9d42'} emissiveIntensity={isActive ? 2 : 1.2} color={isActive ? '#9ffcff' : '#ffd6a3'} depthWrite={false} depthTest={false} />
            </mesh>
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.35, 10]} />
              <meshStandardMaterial emissive={isActive ? '#58f6ff' : '#ff9d42'} emissiveIntensity={isActive ? 1.8 : 1.1} color={isActive ? '#9ffcff' : '#ffd6a3'} depthWrite={false} depthTest={false} />
            </mesh>
            {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => (
              <group key={angle} position={[Math.cos(angle) * 0.7, 0.2, Math.sin(angle) * 0.7]} rotation={[0, -angle + Math.PI, 0]}>
                <mesh position={[0, 0.12, 0]}>
                  <coneGeometry args={[0.08, 0.18, 10]} />
                  <meshStandardMaterial emissive={isActive ? '#58f6ff' : '#ff9d42'} emissiveIntensity={isActive ? 1.8 : 1.2} color={isActive ? '#aaf7ff' : '#ffd6a3'} depthWrite={false} depthTest={false} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}
