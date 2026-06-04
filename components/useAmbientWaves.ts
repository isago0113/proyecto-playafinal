'use client';

import { useEffect, useRef } from 'react';

/**
 * Reproduce el sonido de olas de fondo de forma continua.
 * Se pausa automáticamente cuando musicaActiva = true (tocadiscos reproduciendo).
 */
export function useAmbientWaves(musicaActiva: boolean) {
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const iniciadoRef     = useRef(false);
  const musicaActivaRef = useRef(musicaActiva);
  musicaActivaRef.current = musicaActiva;

  useEffect(() => {
    const ambient = new Audio('/juliush-sandy-beach-calm-waves-water-nature-sounds-8052.mp3');
    ambient.loop   = true;
    ambient.volume = 0.3;
    audioRef.current = ambient;

    const startPlayback = () => {
      if (iniciadoRef.current) return;
      iniciadoRef.current = true;
      if (!musicaActivaRef.current) {
        ambient.play().catch(() => {});
      }
      window.removeEventListener('pointerdown', startPlayback);
      window.removeEventListener('touchstart',  startPlayback);
      window.removeEventListener('keydown',      startPlayback);
    };

    window.addEventListener('pointerdown', startPlayback);
    window.addEventListener('touchstart',  startPlayback, { passive: true });
    window.addEventListener('keydown',     startPlayback);
    // Intento inmediato — falla silenciosamente si el navegador lo bloquea
    startPlayback();

    return () => {
      ambient.pause();
      ambient.currentTime = 0;
      iniciadoRef.current = false;
      window.removeEventListener('pointerdown', startPlayback);
      window.removeEventListener('touchstart',  startPlayback);
      window.removeEventListener('keydown',     startPlayback);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pausa/reanuda según si la música del tocadiscos está activa
  useEffect(() => {
    const ambient = audioRef.current;
    if (!ambient || !iniciadoRef.current) return;
    if (musicaActiva) {
      ambient.pause();
    } else {
      ambient.play().catch(() => {});
    }
  }, [musicaActiva]);
}
