export interface WorkoutConfig {
  id: string;
  name: string;
  description: string;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  warmupSeconds?: number;
  cooldownSeconds?: number;
  exerciseNames?: string[];
}

export const PRESETS: WorkoutConfig[] = [
  {
    id: "tabata",
    name: "Tabata",
    description: "Classic 20s work / 10s rest × 8 rounds",
    workSeconds: 20,
    restSeconds: 10,
    rounds: 8,
    exerciseNames: [
      "Jumping Jacks",
      "High Knees",
      "Burpees",
      "Mountain Climbers",
      "Squat Jumps",
      "Push-ups",
      "Plank Jacks",
      "Speed Skaters",
    ],
  },
  {
    id: "tabata-double",
    name: "Double Tabata",
    description: "Extended Tabata with 16 rounds",
    workSeconds: 20,
    restSeconds: 10,
    rounds: 16,
  },
  {
    id: "emom-1",
    name: "EMOM 10",
    description: "Every Minute On the Minute × 10",
    workSeconds: 40,
    restSeconds: 20,
    rounds: 10,
  },
  {
    id: "emom-15",
    name: "EMOM 15",
    description: "Every Minute On the Minute × 15",
    workSeconds: 40,
    restSeconds: 20,
    rounds: 15,
  },
  {
    id: "30-30",
    name: "30/30",
    description: "Balanced 30s work / 30s rest × 10",
    workSeconds: 30,
    restSeconds: 30,
    rounds: 10,
    exerciseNames: [
      "Warm-up Jog",
      "Lunges",
      "Squats",
      "Push-ups",
      "Plank",
      "Burpees",
      "Jumping Jacks",
      "Mountain Climbers",
      "High Knees",
      "Cool-down Stretch",
    ],
  },
  {
    id: "45-15",
    name: "45/15",
    description: "High volume 45s work / 15s rest × 8",
    workSeconds: 45,
    restSeconds: 15,
    rounds: 8,
  },
];

export function createCustomWorkout(
  workSeconds: number,
  restSeconds: number,
  rounds: number,
  exerciseNames?: string[]
): WorkoutConfig {
  return {
    id: "custom",
    name: "Custom",
    description: `${workSeconds}s work / ${restSeconds}s rest × ${rounds}`,
    workSeconds,
    restSeconds,
    rounds,
    exerciseNames: exerciseNames?.filter((n) => n.trim() !== ""),
  };
}

export function getExerciseName(config: WorkoutConfig, round: number): string | null {
  if (!config.exerciseNames || config.exerciseNames.length === 0) {
    return null;
  }
  if (round <= config.exerciseNames.length) {
    return config.exerciseNames[round - 1] || null;
  }
  return null;
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function getTotalWorkoutTime(config: WorkoutConfig): number {
  return (config.workSeconds + config.restSeconds) * config.rounds;
}

