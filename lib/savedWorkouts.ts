import { createClient } from "@/lib/supabase";
import { SavedWorkout } from "@/lib/database.types";
import { WorkoutConfig } from "@/lib/presets";

export async function getSavedWorkouts(userId: string): Promise<SavedWorkout[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("saved_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching saved workouts:", error);
    return [];
  }

  return data || [];
}

export async function saveWorkout(
  userId: string,
  name: string,
  config: WorkoutConfig
): Promise<SavedWorkout | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("saved_workouts")
    .insert({
      user_id: userId,
      name,
      work_seconds: config.workSeconds,
      rest_seconds: config.restSeconds,
      rounds: config.rounds,
      exercise_names: config.exerciseNames || null,
      is_circuit: config.isCircuit || false,
      exercises: config.exercises || null,
      total_rounds: config.totalRounds || null,
      round_rest_seconds: config.roundRestSeconds || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving workout:", error);
    return null;
  }

  return data;
}

export async function updateWorkout(
  workoutId: string,
  name: string,
  config: WorkoutConfig
): Promise<SavedWorkout | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("saved_workouts")
    .update({
      name,
      work_seconds: config.workSeconds,
      rest_seconds: config.restSeconds,
      rounds: config.rounds,
      exercise_names: config.exerciseNames || null,
      is_circuit: config.isCircuit || false,
      exercises: config.exercises || null,
      total_rounds: config.totalRounds || null,
      round_rest_seconds: config.roundRestSeconds || null,
    })
    .eq("id", workoutId)
    .select()
    .single();

  if (error) {
    console.error("Error updating workout:", error);
    return null;
  }

  return data;
}

export async function deleteWorkout(workoutId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("saved_workouts")
    .delete()
    .eq("id", workoutId);

  if (error) {
    console.error("Error deleting workout:", error);
    return false;
  }

  return true;
}

export function savedWorkoutToConfig(saved: SavedWorkout): WorkoutConfig {
  const isCircuit = saved.is_circuit && saved.exercises && saved.total_rounds;

  const description = isCircuit
    ? `${saved.work_seconds}s work / ${saved.rest_seconds}s rest × ${saved.exercises} 🏃 × ${saved.total_rounds} 🔄`
    : `${saved.work_seconds}s work / ${saved.rest_seconds}s rest × ${saved.rounds}`;

  return {
    id: `saved-${saved.id}`,
    name: saved.name,
    description,
    workSeconds: saved.work_seconds,
    restSeconds: saved.rest_seconds,
    rounds: saved.rounds,
    exerciseNames: saved.exercise_names || undefined,
    isCircuit: saved.is_circuit || undefined,
    exercises: saved.exercises || undefined,
    totalRounds: saved.total_rounds || undefined,
    roundRestSeconds: saved.round_rest_seconds || undefined,
  };
}
