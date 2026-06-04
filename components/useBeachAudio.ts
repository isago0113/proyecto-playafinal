'use client';

import { useState, useEffect, useRef } from 'react';

export interface Cancion {
  nombre: string;
  archivo: string;
}

export const LISTA_CANCIONES: Cancion[] = [
  { nombre: "Unity with Nature", archivo: "/audio/emmraan-unity-with-nature-282919.mp3" },
  { nombre: "Mar Calmado", archivo: "/audio/mesacbertrand-mar-calmado-272997.mp3" },
  { nombre: "Storm in the Dark", archivo: "/audio/lolivac-storm-in-the-dark-502864 (1).mp3" },
  { nombre: "The Kiss of Dawn", archivo: "/audio/elenlackner-the-kiss-of-dawn-music-and-piano-by-elen-lackner-118368.mp3" }
];

export function useBeachAudio() {
  const [cancionActualIndex, setCancionActualIndex] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(LISTA_CANCIONES[cancionActualIndex].archivo);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    if (reproduciendo) {
      audioRef.current.play().catch((err) => console.log("Audio en espera de interacción:", err));
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [cancionActualIndex]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (reproduciendo) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [reproduciendo]);

  const togglePlayPausa = () => setReproduciendo((prev) => !prev);
  const reproducir = () => setReproduciendo(true);
  const pausar = () => setReproduciendo(false);
  const siguienteCancion = () => {
    setCancionActualIndex((prev) => (prev + 1) % LISTA_CANCIONES.length);
  };

  const seleccionarCancion = (index: number) => {
    if (index < 0 || index >= LISTA_CANCIONES.length) return;
    setCancionActualIndex(index);
    setReproduciendo(true);
  };

  return {
    cancionActualIndex,
    cancionActual: LISTA_CANCIONES[cancionActualIndex],
    reproduciendo,
    reproducir,
    pausar,
    togglePlayPausa,
    siguienteCancion,
    seleccionarCancion,
  };
}