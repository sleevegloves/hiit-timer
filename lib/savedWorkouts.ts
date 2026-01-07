import { createClient } from "@/lib/supabase";
import { SavedWorkout } from "@/lib/database.types";
import { WorkoutConfig } from "@/lib/presets";

// Common workout tags
export const WORKOUT_TAGS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Cardio",
  "Strength",
  "Core",
  "Full Body",
  "Upper Body",
  "Lower Body",
  "HIIT",
  "Tabata",
  "No Equipment",
  "Quick",
  "Endurance",
] as const;

export type WorkoutTag = typeof WORKOUT_TAGS[number];

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
  config: WorkoutConfig,
  isPublic: boolean = false,
  description?: string,
  tags?: string[]
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
      is_public: isPublic,
      description: description || null,
      tags: tags?.length ? tags : null,
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
  config: WorkoutConfig,
  isPublic?: boolean,
  description?: string,
  tags?: string[]
): Promise<SavedWorkout | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const updateData: Record<string, unknown> = {
    name,
    work_seconds: config.workSeconds,
    rest_seconds: config.restSeconds,
    rounds: config.rounds,
    exercise_names: config.exerciseNames || null,
    is_circuit: config.isCircuit || false,
    exercises: config.exercises || null,
    total_rounds: config.totalRounds || null,
    round_rest_seconds: config.roundRestSeconds || null,
  };

  if (isPublic !== undefined) {
    updateData.is_public = isPublic;
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  if (tags !== undefined) {
    updateData.tags = tags.length ? tags : null;
  }

  const { data, error } = await supabase
    .from("saved_workouts")
    .update(updateData)
    .eq("id", workoutId)
    .select()
    .single();

  if (error) {
    console.error("Error updating workout:", error);
    return null;
  }

  return data;
}

export async function toggleWorkoutPublic(
  workoutId: string,
  isPublic: boolean
): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("saved_workouts")
    .update({ is_public: isPublic })
    .eq("id", workoutId);

  if (error) {
    console.error("Error toggling workout visibility:", error);
    return false;
  }

  return true;
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

// Community functions
export interface PublicWorkoutFilters {
  minTime?: number; // in seconds
  maxTime?: number; // in seconds
  tags?: string[];
  username?: string;
  sortBy?: "popular" | "recent" | "likes";
}

export interface PublicWorkoutWithProfile extends SavedWorkout {
  owner_username: string | null;
  owner_display_name: string | null;
}

export async function getPublicWorkouts(
  limit: number = 20,
  offset: number = 0,
  filters?: PublicWorkoutFilters
): Promise<PublicWorkoutWithProfile[]> {
  const supabase = createClient();
  if (!supabase) return [];

  // Build query
  let query = supabase
    .from("saved_workouts")
    .select("*")
    .eq("is_public", true);

  // Apply tag filter if provided
  if (filters?.tags?.length) {
    query = query.overlaps("tags", filters.tags);
  }

  // Apply sort
  const sortBy = filters?.sortBy || "popular";
  if (sortBy === "likes") {
    query = query.order("likes_count", { ascending: false });
  } else if (sortBy === "recent") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("times_used", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: workouts, error } = await query;

  if (error) {
    console.error("Error fetching public workouts:", error);
    return [];
  }

  if (!workouts?.length) return [];

  // Filter by time on client side (calculated field)
  let filteredWorkouts = workouts;
  if (filters?.minTime || filters?.maxTime) {
    filteredWorkouts = workouts.filter((w) => {
      const totalTime = calculateWorkoutTime(w);
      if (filters.minTime && totalTime < filters.minTime) return false;
      if (filters.maxTime && totalTime > filters.maxTime) return false;
      return true;
    });
  }

  // Get unique owner IDs and fetch profiles
  const ownerIds = Array.from(new Set(filteredWorkouts.map((w) => w.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", ownerIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, { username: p.username, display_name: p.display_name }])
  );

  // Filter by username if provided
  let result = filteredWorkouts.map((w) => {
    const profile = profileMap.get(w.user_id);
    return {
      ...w,
      owner_username: profile?.username || null,
      owner_display_name: profile?.display_name || null,
    };
  });

  if (filters?.username) {
    const searchUsername = filters.username.toLowerCase();
    result = result.filter(
      (w) => w.owner_username?.toLowerCase().includes(searchUsername) ||
             w.owner_display_name?.toLowerCase().includes(searchUsername)
    );
  }

  return result;
}

function calculateWorkoutTime(workout: SavedWorkout): number {
  const intervalTime = (workout.work_seconds + workout.rest_seconds) * workout.rounds;
  if (workout.is_circuit && workout.total_rounds && workout.round_rest_seconds) {
    return intervalTime + workout.round_rest_seconds * (workout.total_rounds - 1);
  }
  return intervalTime;
}

export async function searchPublicWorkouts(
  query: string,
  limit: number = 20
): Promise<PublicWorkoutWithProfile[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: workouts, error } = await supabase
    .from("saved_workouts")
    .select("*")
    .eq("is_public", true)
    .ilike("name", `%${query}%`)
    .order("times_used", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error searching workouts:", error);
    return [];
  }

  if (!workouts?.length) return [];

  // Get profiles
  const ownerIds = Array.from(new Set(workouts.map((w) => w.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", ownerIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, { username: p.username, display_name: p.display_name }])
  );

  return workouts.map((w) => {
    const profile = profileMap.get(w.user_id);
    return {
      ...w,
      owner_username: profile?.username || null,
      owner_display_name: profile?.display_name || null,
    };
  });
}

export async function incrementWorkoutUsage(workoutId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  // Use RPC or raw query to increment
  await supabase.rpc("increment_workout_usage", { workout_id: workoutId });
}

// Like functions
export async function likeWorkout(userId: string, workoutId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("workout_likes")
    .insert({ user_id: userId, workout_id: workoutId });

  if (error) {
    if (error.code === "23505") {
      // Already liked
      return true;
    }
    console.error("Error liking workout:", error);
    return false;
  }

  return true;
}

export async function unlikeWorkout(userId: string, workoutId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("workout_likes")
    .delete()
    .eq("user_id", userId)
    .eq("workout_id", workoutId);

  if (error) {
    console.error("Error unliking workout:", error);
    return false;
  }

  return true;
}

export async function getLikedWorkoutIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  if (!supabase) return new Set();

  const { data, error } = await supabase
    .from("workout_likes")
    .select("workout_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching liked workout IDs:", error);
    return new Set();
  }

  return new Set((data || []).map((r) => r.workout_id));
}

export async function saveWorkoutToCollection(
  userId: string,
  workoutId: string
): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  console.log("[SaveToCollection] Saving:", { userId, workoutId });

  const { data, error } = await supabase
    .from("workout_saves")
    .insert({ user_id: userId, workout_id: workoutId })
    .select();

  console.log("[SaveToCollection] Result:", { data, error });

  if (error) {
    if (error.code === "23505") {
      // Already saved
      console.log("[SaveToCollection] Already saved");
      return true;
    }
    console.error("[SaveToCollection] Error:", error);
    return false;
  }

  return true;
}

export async function unsaveWorkoutFromCollection(
  userId: string,
  workoutId: string
): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("workout_saves")
    .delete()
    .eq("user_id", userId)
    .eq("workout_id", workoutId);

  if (error) {
    console.error("Error removing workout from collection:", error);
    return false;
  }

  return true;
}

export async function getSavedWorkoutIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  if (!supabase) return new Set();

  const { data, error } = await supabase
    .from("workout_saves")
    .select("workout_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching saved workout IDs:", error);
    return new Set();
  }

  return new Set((data || []).map((r) => r.workout_id));
}

export interface SavedCommunityWorkout extends SavedWorkout {
  owner_username: string | null;
  owner_display_name: string | null;
}

export async function getSavedCommunityWorkouts(userId: string): Promise<SavedCommunityWorkout[]> {
  const supabase = createClient();
  if (!supabase) {
    console.log("[Community] No supabase client");
    return [];
  }

  // Get the workout IDs the user has saved
  const { data: saves, error: savesError } = await supabase
    .from("workout_saves")
    .select("workout_id")
    .eq("user_id", userId);

  console.log("[Community] Saves query:", { saves, savesError });

  if (savesError) {
    console.error("[Community] Error fetching saves:", savesError);
    return [];
  }

  if (!saves?.length) {
    console.log("[Community] No saves found");
    return [];
  }

  const workoutIds = saves.map((s) => s.workout_id);
  console.log("[Community] Workout IDs to fetch:", workoutIds);

  // Fetch those workouts (without FK join - will get profiles separately)
  const { data: workouts, error: workoutsError } = await supabase
    .from("saved_workouts")
    .select("*")
    .in("id", workoutIds)
    .neq("user_id", userId); // Exclude user's own workouts

  console.log("[Community] Workouts query:", { workouts, workoutsError });

  if (workoutsError) {
    console.error("[Community] Error fetching workouts:", workoutsError);
    return [];
  }

  if (!workouts?.length) {
    return [];
  }

  // Get unique owner IDs and fetch their profiles
  const ownerIds = Array.from(new Set(workouts.map((w) => w.user_id)));
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", ownerIds);

  console.log("[Community] Profiles query:", { profiles, profilesError });

  // Create a map for quick lookup
  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, { username: p.username, display_name: p.display_name }])
  );

  const result = workouts.map((w) => {
    const profile = profileMap.get(w.user_id);
    return {
      ...w,
      owner_username: profile?.username || null,
      owner_display_name: profile?.display_name || null,
    };
  }) as SavedCommunityWorkout[];

  console.log("[Community] Final result:", result);
  return result;
}

export function savedWorkoutToConfig(saved: SavedWorkout): WorkoutConfig {
  const isCircuit = saved.is_circuit && saved.exercises && saved.total_rounds;

  const description = isCircuit
    ? `${saved.work_seconds}s work / ${saved.rest_seconds}s rest × ${saved.exercises} 🏃 × ${saved.total_rounds} 🔄`
    : `${saved.work_seconds}s work / ${saved.rest_seconds}s rest × ${saved.rounds}`;

  return {
    id: `saved-${saved.id}`,
    name: saved.name,
    description: saved.description || description,
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
