"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WorkoutConfig } from "@/lib/presets";

export type Phase = "idle" | "countdown" | "work" | "rest" | "complete";

export interface TimerState {
  phase: Phase;
  secondsRemaining: number;
  currentRound: number;
  totalRounds: number;
  isRunning: boolean;
  workSeconds: number;
  restSeconds: number;
}

interface UseTimerOptions {
  onPhaseChange?: (phase: Phase, round: number) => void;
  onTick?: (seconds: number) => void;
  onComplete?: () => void;
  countdownSeconds?: number;
}

export function useTimer(config: WorkoutConfig | null, options: UseTimerOptions = {}) {
  const { onPhaseChange, onTick, onComplete, countdownSeconds = 3 } = options;

  const [state, setState] = useState<TimerState>({
    phase: "idle",
    secondsRemaining: 0,
    currentRound: 0,
    totalRounds: config?.rounds ?? 0,
    isRunning: false,
    workSeconds: config?.workSeconds ?? 0,
    restSeconds: config?.restSeconds ?? 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
    if (config && state.phase === "idle") {
      setState((prev) => ({
        ...prev,
        totalRounds: config.rounds,
        workSeconds: config.workSeconds,
        restSeconds: config.restSeconds,
      }));
    }
  }, [config, state.phase]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning || !configRef.current) return prev;

      const newSeconds = prev.secondsRemaining - 1;
      onTick?.(newSeconds);

      if (newSeconds > 0) {
        return { ...prev, secondsRemaining: newSeconds };
      }

      const config = configRef.current;

      if (prev.phase === "countdown") {
        onPhaseChange?.("work", 1);
        return {
          ...prev,
          phase: "work" as Phase,
          secondsRemaining: config.workSeconds,
          currentRound: 1,
        };
      }

      if (prev.phase === "work") {
        if (prev.currentRound >= config.rounds) {
          onPhaseChange?.("complete", prev.currentRound);
          onComplete?.();
          return {
            ...prev,
            phase: "complete" as Phase,
            secondsRemaining: 0,
            isRunning: false,
          };
        }
        onPhaseChange?.("rest", prev.currentRound);
        return {
          ...prev,
          phase: "rest" as Phase,
          secondsRemaining: config.restSeconds,
        };
      }

      if (prev.phase === "rest") {
        const nextRound = prev.currentRound + 1;
        onPhaseChange?.("work", nextRound);
        return {
          ...prev,
          phase: "work" as Phase,
          secondsRemaining: config.workSeconds,
          currentRound: nextRound,
        };
      }

      return prev;
    });
  }, [onTick, onPhaseChange, onComplete]);

  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [state.isRunning, tick, clearTimer]);

  const start = useCallback(() => {
    if (!config) return;

    setState((prev) => ({
      ...prev,
      phase: "countdown",
      secondsRemaining: countdownSeconds,
      currentRound: 0,
      totalRounds: config.rounds,
      workSeconds: config.workSeconds,
      restSeconds: config.restSeconds,
      isRunning: true,
    }));
    onPhaseChange?.("countdown", 0);
  }, [config, countdownSeconds, onPhaseChange]);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resume = useCallback(() => {
    if (state.phase !== "idle" && state.phase !== "complete") {
      setState((prev) => ({ ...prev, isRunning: true }));
    }
  }, [state.phase]);

  const reset = useCallback(() => {
    clearTimer();
    setState({
      phase: "idle",
      secondsRemaining: 0,
      currentRound: 0,
      totalRounds: config?.rounds ?? 0,
      isRunning: false,
      workSeconds: config?.workSeconds ?? 0,
      restSeconds: config?.restSeconds ?? 0,
    });
  }, [clearTimer, config]);

  const toggle = useCallback(() => {
    if (state.phase === "idle") {
      start();
    } else if (state.isRunning) {
      pause();
    } else {
      resume();
    }
  }, [state.phase, state.isRunning, start, pause, resume]);

  return {
    ...state,
    start,
    pause,
    resume,
    reset,
    toggle,
  };
}

