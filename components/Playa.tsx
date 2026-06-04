'use client';

import { useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { XROrigin } from '@react-three/xr';
import { Vector3, Group } from 'three';

import ControlesVideojuego from './ControlesVideojuego';
import EntornoObjetos from './EntornoObjetos';
import Tocadiscos from './Tocadiscos';
import Pelota from './Pelota';
import MesaInteractiva from './MesaInteractiva';
import { useBeachAudio } from './useBeachAudio';
import { useAmbientWaves } from './useAmbientWaves';
import InteractionIndicators, {
  type IndicatorPoint,
  type InteractionTarget,
} from './InteractionIndicators';
import { SOLID_BOUNDS, WALKABLE_ZONES } from './collisionConfig';

const RADIO_INTERACCION = 3.5;

// Indicadores solo en tocadiscos y mesa psicológica.
// Posición Y elevada para que la flecha sea visible por encima de los objetos.
const PUNTOS_INTERACCION: IndicatorPoint[] = [
  { id: 'mesa',       position: [6.6,  1.8,  0.4] },
  { id: 'tocadiscos', position: [1.7,  2.1, -5.9] },
];

interface PlayaProps {
  studentId: string;
}

export default function Playa({ studentId }: PlayaProps) {
  const { scene }  = useGLTF('https://o2f7krpbx42yg1ho.public.blob.vercel-storage.com/beach.glb');
  const { camera } = useThree();

  const [objetivoActivo, setObjetivoActivo] = useState<InteractionTarget | null>(null);

  const grupoJugadorRef = useRef<Group>(null);

  const {
    reproduciendo,
    cancionActualIndex,
    togglePlayPausa,
    siguienteCancion,
    seleccionarCancion,
  } = useBeachAudio();

  // Olas siempre activas; se pausan automáticamente cuando el tocadiscos reproduce
  useAmbientWaves(reproduciendo);

  const [animandoPelota, setAnimandoPelota] = useState(false);

  useFrame(() => {
    const gPos = grupoJugadorRef.current?.position;
    const posicionPersona = new Vector3(
      (gPos?.x ?? 0) + camera.position.x,
      0,
      (gPos?.z ?? 0) + camera.position.z,
    );

    const vectorPunto = new Vector3();
    let objetivoCercano: InteractionTarget | null = null;
    let distanciaMinima = Infinity;

    for (const punto of PUNTOS_INTERACCION) {
      vectorPunto.set(punto.position[0], punto.position[1], punto.position[2]);
      const distancia = posicionPersona.distanceTo(vectorPunto);
      if (distancia < RADIO_INTERACCION && distancia < distanciaMinima) {
        objetivoCercano = punto.id as InteractionTarget;
        distanciaMinima = distancia;
      }
    }

    if (objetivoCercano !== objetivoActivo) setObjetivoActivo(objetivoCercano);
  });

  return (
    <group name="escena-playa-vr">

      <group ref={grupoJugadorRef}>
        <XROrigin />
      </group>

      <ControlesVideojuego
        activo={true}
        uiInteractivaActiva={false}
        walkableMeshes={[]}
        obstacleMeshes={[]}
        walkableZones={WALKABLE_ZONES}
        solidBounds={SOLID_BOUNDS}
        playerGroupRef={grupoJugadorRef}
      />

      <primitive object={scene} onUpdate={(self: import('three').Object3D) => {
        if ((self as any).__debugDone) return;
        (self as any).__debugDone = true;
        const worldPos = new Vector3();
        self.traverse((obj) => {
          if (!obj.name) return;
          obj.getWorldPosition(worldPos);
          console.log(`[GLB] ${obj.type} | "${obj.name}" | x:${worldPos.x.toFixed(3)} y:${worldPos.y.toFixed(3)} z:${worldPos.z.toFixed(3)}`);
        });
      }} />
      <EntornoObjetos scene={scene} />

      <InteractionIndicators
        points={PUNTOS_INTERACCION}
        activeTarget={objetivoActivo}
      />

      <Tocadiscos
        scene={scene}
        reproduciendo={reproduciendo}
        cancionActualIndex={cancionActualIndex}
        togglePlayPausa={togglePlayPausa}
        siguienteCancion={siguienteCancion}
        seleccionarCancion={seleccionarCancion}
      />

      <Pelota
        scene={scene}
        animando={animandoPelota}
        setAnimando={setAnimandoPelota}
      />

      <MesaInteractiva
        scene={scene}
        studentId={studentId}
      />
    </group>
  );
}

useGLTF.preload('https://o2f7krpbx42yg1ho.public.blob.vercel-storage.com/beach.glb');
