"use client";

import { Phase } from "@/hooks/useTimer";

interface TimerDisplayProps {
  seconds: number;
  phase: Phase;
  currentInterval: number;
  totalIntervals: number;
  exerciseName?: string | null;
  // Circuit mode
  isCircuit?: boolean;
  currentRound?: number;
  totalRounds?: number;
  currentExercise?: number;
  totalExercises?: number;
}

export function TimerDisplay({
  seconds,
  phase,
  currentInterval,
  totalIntervals,
  exerciseName,
  isCircuit,
  currentRound,
  totalRounds,
  currentExercise,
  totalExercises,
}: TimerDisplayProps) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const phaseLabel = {
    idle: "Ready",
    countdown: "Get Ready",
    work: "WORK",
    rest: "REST",
    roundRest: "ROUND REST",
    complete: "Done!",
  }[phase];

  const phaseColor = {
    idle: "text-foreground",
    countdown: "text-accent",
    work: "text-work",
    rest: "text-rest",
    roundRest: "text-accent",
    complete: "text-accent",
  }[phase];

  return (
    <div className="flex flex-col items-center">
      {exerciseName && phase === "work" && (
        <span className="text-lg font-semibold text-foreground mb-1 max-w-[200px] text-center truncate">
          {exerciseName}
        </span>
      )}

      <span className={`text-xl font-bold uppercase tracking-widest ${phaseColor}`}>
        {phaseLabel}
      </span>

      <div className="timer-display text-7xl font-mono font-bold text-foreground my-2">
        {phase === "countdown" ? (
          <span className="text-accent">{seconds}</span>
        ) : (
          <>
            {minutes.toString().padStart(2, "0")}
            <span className="opacity-50">:</span>
            {secs.toString().padStart(2, "0")}
          </>
        )}
      </div>

      {phase !== "idle" && phase !== "complete" && (
        <div className="text-center">
          {isCircuit && totalRounds && totalRounds > 1 ? (
            <>
              <span className="text-muted-foreground font-medium block">
                Round {currentRound} / {totalRounds}
              </span>
              <span className="text-sm text-muted-foreground">
                Exercise {currentExercise} / {totalExercises}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground font-medium">
              Round {currentInterval} / {totalIntervals}
            </span>
          )}
        </div>
      )}

    </div>
  );
}
