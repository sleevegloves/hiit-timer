"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WorkoutConfig, getExerciseName } from "@/lib/presets";
import { addWorkoutToHistory } from "@/lib/history";
import { useTimer, Phase } from "@/hooks/useTimer";
import { useAudio } from "@/hooks/useAudio";
import { ProgressRing } from "@/components/ProgressRing";
import { TimerDisplay } from "@/components/TimerDisplay";
import { Controls } from "@/components/Controls";

export default function TimerPage() {
  const router = useRouter();
  const [config, setConfig] = useState<WorkoutConfig | null>(null);
  const [workoutSaved, setWorkoutSaved] = useState(false);

  const audio = useAudio();

  const handlePhaseChange = useCallback(
    (phase: Phase, round: number) => {
      void round;
      if (phase === "countdown") {
        audio.initAudio();
      } else if (phase === "work") {
        audio.playWorkStart();
      } else if (phase === "rest") {
        audio.playRestStart();
      } else if (phase === "complete") {
        audio.playComplete();
      }
    },
    [audio]
  );

  const handleTick = useCallback(
    (seconds: number) => {
      if (seconds <= 3 && seconds > 0) {
        audio.playCountdownBeep();
      }
    },
    [audio]
  );

  const handleComplete = useCallback(() => {
    if (config && !workoutSaved) {
      const totalTime = (config.workSeconds + config.restSeconds) * config.rounds;
      addWorkoutToHistory(
        config.name,
        config.workSeconds,
        config.restSeconds,
        config.rounds,
        totalTime
      );
      setWorkoutSaved(true);
    }
  }, [config, workoutSaved]);

  const timer = useTimer(config, {
    onPhaseChange: handlePhaseChange,
    onTick: handleTick,
    onComplete: handleComplete,
    countdownSeconds: 3,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("hiit-workout-config");
    if (stored) {
      try {
        setConfig(JSON.parse(stored));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleBack = () => {
    timer.reset();
    router.push("/");
  };

  const handleReset = () => {
    setWorkoutSaved(false);
    timer.reset();
  };

  const getProgress = () => {
    if (!config) return 0;

    switch (timer.phase) {
      case "idle":
        return 0;
      case "countdown":
        return 1 - timer.secondsRemaining / 3;
      case "work":
        return 1 - timer.secondsRemaining / config.workSeconds;
      case "rest":
        return 1 - timer.secondsRemaining / config.restSeconds;
      case "complete":
        return 1;
      default:
        return 0;
    }
  };

  const getRingColor = () => {
    switch (timer.phase) {
      case "work":
        return "rgb(var(--work))";
      case "rest":
        return "rgb(var(--rest))";
      default:
        return "rgb(var(--accent))";
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-semibold text-muted-foreground mb-8">
        {config.name}
      </h1>

      <div className="mb-12">
        <ProgressRing
          progress={getProgress()}
          color={getRingColor()}
          size={300}
          strokeWidth={14}
        >
          <TimerDisplay
            seconds={timer.secondsRemaining}
            phase={timer.phase}
            currentRound={timer.currentRound}
            totalRounds={timer.totalRounds}
            exerciseName={getExerciseName(config, timer.currentRound)}
          />
        </ProgressRing>
      </div>

      {timer.phase !== "idle" && timer.phase !== "complete" && config.rounds <= 20 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-xs">
          {Array.from({ length: config.rounds }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < timer.currentRound
                  ? "bg-accent"
                  : i === timer.currentRound - 1 && timer.phase === "work"
                  ? "bg-work"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      <Controls
        phase={timer.phase}
        isRunning={timer.isRunning}
        onToggle={timer.toggle}
        onReset={handleReset}
        onBack={handleBack}
      />

      {timer.phase === "complete" && (
        <div className="mt-8 text-center">
          <p className="text-2xl font-bold text-accent mb-2">Great workout!</p>
          <p className="text-muted-foreground">
            {config.rounds} rounds completed
          </p>
        </div>
      )}
    </main>
  );
}

