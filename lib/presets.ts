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
  // Circuit mode fields
  isCircuit?: boolean;
  exercises?: number;        // Number of exercises per round
  totalRounds?: number;      // Number of times to repeat the circuit
  roundRestSeconds?: number; // Rest between circuit rounds
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
    id: "circuit-1",
    name: "Circuit 4x3",
    description: "45s work / 15s rest × 4 🏃 × 3 🔄",
    workSeconds: 45,
    restSeconds: 15,
    rounds: 12, // Total intervals (4 exercises × 3 rounds)
    isCircuit: true,
    exercises: 4,
    totalRounds: 3,
    roundRestSeconds: 60,
    exerciseNames: [
      "Squats",
      "Push-ups",
      "Lunges",
      "Plank",
    ],
  },
  {
    id: "30-30",
    name: "30/30",
    description: "Balanced 30s work / 30s rest × 10",
    workSeconds: 30,
    restSeconds: 30,
    rounds: 10,
  },
];

export function createCustomWorkout(
  workSeconds: number,
  restSeconds: number,
  rounds: number,
  exerciseNames?: string[],
  isCircuit?: boolean,
  exercises?: number,
  totalRounds?: number,
  roundRestSeconds?: number
): WorkoutConfig {
  if (isCircuit && exercises && totalRounds) {
    return {
      id: "custom",
      name: "Custom Circuit",
      description: `${workSeconds}s work / ${restSeconds}s rest × ${exercises} 🏃 × ${totalRounds} 🔄`,
      workSeconds,
      restSeconds,
      rounds: exercises * totalRounds,
      exerciseNames: exerciseNames?.filter((n) => n.trim() !== ""),
      isCircuit: true,
      exercises,
      totalRounds,
      roundRestSeconds: roundRestSeconds || 60,
    };
  }

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

export function getExerciseName(config: WorkoutConfig, exerciseIndex: number): string | null {
  if (!config.exerciseNames || config.exerciseNames.length === 0) {
    return null;
  }

  if (config.isCircuit && config.exercises) {
    // For circuit mode, cycle through exercise names
    const idx = (exerciseIndex - 1) % config.exercises;
    return config.exerciseNames[idx] || null;
  }

  // For regular mode
  if (exerciseIndex <= config.exerciseNames.length) {
    return config.exerciseNames[exerciseIndex - 1] || null;
  }
  return null;
}

export function getNextExerciseName(config: WorkoutConfig, currentInterval: number): string | null {
  if (!config.exerciseNames || config.exerciseNames.length === 0) {
    return null;
  }

  const nextInterval = currentInterval + 1;

  // Check if there's a next interval
  if (nextInterval > config.rounds) {
    return null;
  }

  if (config.isCircuit && config.exercises) {
    // For circuit mode, cycle through exercise names
    const idx = (nextInterval - 1) % config.exercises;
    return config.exerciseNames[idx] || null;
  }

  // For regular mode
  if (nextInterval <= config.exerciseNames.length) {
    return config.exerciseNames[nextInterval - 1] || null;
  }
  return null;
}

export function getCurrentRoundInCircuit(config: WorkoutConfig, intervalIndex: number): number {
  if (!config.isCircuit || !config.exercises) return 1;
  return Math.floor((intervalIndex - 1) / config.exercises) + 1;
}

export function getCurrentExerciseInRound(config: WorkoutConfig, intervalIndex: number): number {
  if (!config.isCircuit || !config.exercises) return intervalIndex;
  return ((intervalIndex - 1) % config.exercises) + 1;
}

export function isEndOfCircuitRound(config: WorkoutConfig, intervalIndex: number): boolean {
  if (!config.isCircuit || !config.exercises || !config.totalRounds) return false;
  const currentRound = getCurrentRoundInCircuit(config, intervalIndex);
  const exerciseInRound = getCurrentExerciseInRound(config, intervalIndex);
  return exerciseInRound === config.exercises && currentRound < config.totalRounds;
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function getTotalWorkoutTime(config: WorkoutConfig): number {
  const intervalTime = (config.workSeconds + config.restSeconds) * config.rounds;

  if (config.isCircuit && config.totalRounds && config.roundRestSeconds) {
    // Add round rest time (one less than total rounds, since no rest after last round)
    const roundRestTime = config.roundRestSeconds * (config.totalRounds - 1);
    return intervalTime + roundRestTime;
  }

  return intervalTime;
}
