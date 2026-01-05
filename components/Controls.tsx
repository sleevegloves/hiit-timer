"use client";

import { Phase } from "@/hooks/useTimer";

interface ControlsProps {
  phase: Phase;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onBack: () => void;
}

export function Controls({ phase, isRunning, onToggle, onReset, onBack }: ControlsProps) {
  const showPlayPause = phase !== "idle" && phase !== "complete";
  const showStart = phase === "idle";
  const showRestart = phase === "complete";

  return (
    <div className="flex items-center justify-center gap-5">
      <button
        onClick={onBack}
        className="p-4 rounded-full bg-card border-2 border-border hover:bg-muted hover:border-muted-foreground/30 transition-all active:scale-95"
        aria-label="Go back"
      >
        <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {showStart && (
        <button
          onClick={onToggle}
          className="w-24 h-24 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-accent/30"
          aria-label="Start"
        >
          <svg className="w-12 h-12 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      {showPlayPause && (
        <button
          onClick={onToggle}
          className={`w-24 h-24 rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xl ${
            isRunning
              ? "bg-card border-2 border-border text-foreground shadow-black/10"
              : "bg-accent text-accent-foreground shadow-accent/30"
          }`}
          aria-label={isRunning ? "Pause" : "Resume"}
        >
          {isRunning ? (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-12 h-12 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}

      {showRestart && (
        <button
          onClick={onReset}
          className="w-24 h-24 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-accent/30"
          aria-label="Restart"
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}

      {showPlayPause && (
        <button
          onClick={onReset}
          className="p-4 rounded-full bg-card border-2 border-border hover:bg-muted hover:border-muted-foreground/30 transition-all active:scale-95"
          aria-label="Reset"
        >
          <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
