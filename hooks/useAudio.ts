"use client";

import { useCallback, useRef, useEffect } from "react";

interface UseAudioOptions {
  enabled?: boolean;
}

export function useAudio(options: UseAudioOptions = {}) {
  const { enabled = true } = options;
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, volume: number = 0.3) => {
      if (!enabled) return;

      try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      } catch (error) {
        console.warn("Audio playback failed:", error);
      }
    },
    [enabled, getAudioContext]
  );

  const playCountdownBeep = useCallback(() => {
    playTone(880, 0.1, 0.25);
  }, [playTone]);

  const playWorkStart = useCallback(() => {
    playTone(1047, 0.15, 0.4);
    setTimeout(() => playTone(1319, 0.2, 0.4), 150);
  }, [playTone]);

  const playRestStart = useCallback(() => {
    playTone(659, 0.15, 0.35);
    setTimeout(() => playTone(523, 0.2, 0.35), 150);
  }, [playTone]);

  const playComplete = useCallback(() => {
    playTone(523, 0.15, 0.4);
    setTimeout(() => playTone(659, 0.15, 0.4), 150);
    setTimeout(() => playTone(784, 0.15, 0.4), 300);
    setTimeout(() => playTone(1047, 0.3, 0.5), 450);
  }, [playTone]);

  const playFinalCountdown = useCallback(
    (secondsLeft: number) => {
      if (secondsLeft <= 3 && secondsLeft > 0) {
        playTone(660 + (3 - secondsLeft) * 110, 0.1, 0.3);
      }
    },
    [playTone]
  );

  const initAudio = useCallback(() => {
    getAudioContext();
  }, [getAudioContext]);

  return {
    playCountdownBeep,
    playWorkStart,
    playRestStart,
    playComplete,
    playFinalCountdown,
    playTone,
    initAudio,
  };
}

