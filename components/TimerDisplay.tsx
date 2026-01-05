"use client";

import { Phase } from "@/hooks/useTimer";

interface TimerDisplayProps {
  seconds: number;
  phase: Phase;
  currentRound: number;
  totalRounds: number;
  exerciseName?: string | null;
}

export function TimerDisplay({ seconds, phase, currentRound, totalRounds, exerciseName }: TimerDisplayProps) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const phaseLabel = {
    idle: "Ready",
    countdown: "Get Ready",
    work: "WORK",
    rest: "REST",
    complete: "Done!",
  }[phase];

  const phaseColor = {
    idle: "text-foreground",
    countdown: "text-accent",
    work: "text-work",
    rest: "text-rest",
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
        <span className="text-muted-foreground font-medium">
          Round {currentRound} / {totalRounds}
        </span>
      )}
    </div>
  );
}

