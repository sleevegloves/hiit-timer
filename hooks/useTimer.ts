"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WorkoutConfig, isEndOfCircuitRound, getCurrentRoundInCircuit, getCurrentExerciseInRound } from "@/lib/presets";

export type Phase = "idle" | "countdown" | "work" | "rest" | "roundRest" | "complete";

export interface TimerState {
  phase: Phase;
  secondsRemaining: number;
  currentInterval: number;    // Current interval (1 to total)
  totalIntervals: number;     // Total number of work intervals
  isRunning: boolean;
  workSeconds: number;
  restSeconds: number;
  // Circuit mode specific
  currentRound: number;       // Current circuit round (1 to totalRounds)
  totalRounds: number;        // Total circuit rounds
  currentExercise: number;    // Current exercise in the round
  totalExercises: number;     // Exercises per round
  isCircuit: boolean;
}

interface UseTimerOptions {
  onPhaseChange?: (phase: Phase, interval: number) => void;
  onTick?: (seconds: number) => void;
  onComplete?: () => void;
  countdownSeconds?: number;
}

export function useTimer(config: WorkoutConfig | null, options: UseTimerOptions = {}) {
  const { onPhaseChange, onTick, onComplete, countdownSeconds = 3 } = options;

  const getInitialState = useCallback((): TimerState => ({
    phase: "idle",
    secondsRemaining: 0,
    currentInterval: 0,
    totalIntervals: config?.rounds ?? 0,
    isRunning: false,
    workSeconds: config?.workSeconds ?? 0,
    restSeconds: config?.restSeconds ?? 0,
    currentRound: 0,
    totalRounds: config?.totalRounds ?? 1,
    currentExercise: 0,
    totalExercises: config?.exercises ?? config?.rounds ?? 0,
    isCircuit: config?.isCircuit ?? false,
  }), [config]);

  const [state, setState] = useState<TimerState>(getInitialState);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
    if (config && state.phase === "idle") {
      setState(getInitialState());
    }
  }, [config, state.phase, getInitialState]);

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

      // Countdown finished - start first work interval
      if (prev.phase === "countdown") {
        const newInterval = 1;
        const circuitRound = config.isCircuit ? getCurrentRoundInCircuit(config, newInterval) : 1;
        const exerciseNum = config.isCircuit ? getCurrentExerciseInRound(config, newInterval) : newInterval;
        
        onPhaseChange?.("work", newInterval);
        return {
          ...prev,
          phase: "work" as Phase,
          secondsRemaining: config.workSeconds,
          currentInterval: newInterval,
          currentRound: circuitRound,
          currentExercise: exerciseNum,
        };
      }

      // Work finished
      if (prev.phase === "work") {
        // Check if this was the last interval
        if (prev.currentInterval >= config.rounds) {
          onPhaseChange?.("complete", prev.currentInterval);
          onComplete?.();
          return {
            ...prev,
            phase: "complete" as Phase,
            secondsRemaining: 0,
            isRunning: false,
          };
        }

        // Check if we need round rest (end of circuit round but not last round)
        if (config.isCircuit && isEndOfCircuitRound(config, prev.currentInterval)) {
          onPhaseChange?.("roundRest", prev.currentInterval);
          return {
            ...prev,
            phase: "roundRest" as Phase,
            secondsRemaining: config.roundRestSeconds || 60,
          };
        }

        // Regular rest between exercises
        onPhaseChange?.("rest", prev.currentInterval);
        return {
          ...prev,
          phase: "rest" as Phase,
          secondsRemaining: config.restSeconds,
        };
      }

      // Regular rest finished - start next work interval
      if (prev.phase === "rest") {
        const nextInterval = prev.currentInterval + 1;
        const circuitRound = config.isCircuit ? getCurrentRoundInCircuit(config, nextInterval) : 1;
        const exerciseNum = config.isCircuit ? getCurrentExerciseInRound(config, nextInterval) : nextInterval;
        
        onPhaseChange?.("work", nextInterval);
        return {
          ...prev,
          phase: "work" as Phase,
          secondsRemaining: config.workSeconds,
          currentInterval: nextInterval,
          currentRound: circuitRound,
          currentExercise: exerciseNum,
        };
      }

      // Round rest finished - start next circuit round
      if (prev.phase === "roundRest") {
        const nextInterval = prev.currentInterval + 1;
        const circuitRound = config.isCircuit ? getCurrentRoundInCircuit(config, nextInterval) : 1;
        const exerciseNum = config.isCircuit ? getCurrentExerciseInRound(config, nextInterval) : nextInterval;
        
        onPhaseChange?.("work", nextInterval);
        return {
          ...prev,
          phase: "work" as Phase,
          secondsRemaining: config.workSeconds,
          currentInterval: nextInterval,
          currentRound: circuitRound,
          currentExercise: exerciseNum,
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

    setState({
      phase: "countdown",
      secondsRemaining: countdownSeconds,
      currentInterval: 0,
      totalIntervals: config.rounds,
      isRunning: true,
      workSeconds: config.workSeconds,
      restSeconds: config.restSeconds,
      currentRound: 0,
      totalRounds: config.totalRounds ?? 1,
      currentExercise: 0,
      totalExercises: config.exercises ?? config.rounds,
      isCircuit: config.isCircuit ?? false,
    });
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
    setState(getInitialState());
  }, [clearTimer, getInitialState]);

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
