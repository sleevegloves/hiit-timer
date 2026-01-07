import { createClient } from "@/lib/supabase";
import { WorkoutHistory } from "@/lib/database.types";

export interface WorkoutRecord {
  id: string;
  presetName: string;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  totalTime: number;
  completedAt: string;
}

const STORAGE_KEY = "hiit-workout-history";

// Local storage functions (fallback/cache)
export function getLocalHistory(): WorkoutRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(history: WorkoutRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
}

// Database functions
export async function getHistory(userId?: string): Promise<WorkoutRecord[]> {
  if (!userId) {
    return getLocalHistory();
  }

  const supabase = createClient();
  if (!supabase) {
    return getLocalHistory();
  }

  const { data, error } = await supabase
    .from("workout_history")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching history:", error);
    return getLocalHistory();
  }

  // Convert DB format to local format
  return (data || []).map(dbRecordToLocal);
}

export async function addWorkoutToHistory(
  presetName: string,
  workSeconds: number,
  restSeconds: number,
  rounds: number,
  totalTime: number,
  userId?: string
): Promise<WorkoutRecord> {
  const record: WorkoutRecord = {
    id: crypto.randomUUID(),
    presetName,
    workSeconds,
    restSeconds,
    rounds,
    totalTime,
    completedAt: new Date().toISOString(),
  };

  // Always save to local storage as cache
  const localHistory = getLocalHistory();
  localHistory.unshift(record);
  saveLocalHistory(localHistory);

  // If logged in, also save to database
  if (userId) {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from("workout_history").insert({
        id: record.id,
        user_id: userId,
        workout_name: presetName,
        work_seconds: workSeconds,
        rest_seconds: restSeconds,
        rounds,
        total_time: totalTime,
        completed_at: record.completedAt,
      });

      if (error) {
        console.error("Error saving history to DB:", error);
      }
    }
  }

  return record;
}

export async function syncLocalHistoryToDb(userId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const localHistory = getLocalHistory();
  if (localHistory.length === 0) return;

  // Get existing DB history to avoid duplicates
  const { data: existing } = await supabase
    .from("workout_history")
    .select("id")
    .eq("user_id", userId);

  const existingIds = new Set((existing || []).map((r) => r.id));

  // Filter out already synced records
  const toSync = localHistory.filter((r) => !existingIds.has(r.id));

  if (toSync.length === 0) return;

  const { error } = await supabase.from("workout_history").insert(
    toSync.map((r) => ({
      id: r.id,
      user_id: userId,
      workout_name: r.presetName,
      work_seconds: r.workSeconds,
      rest_seconds: r.restSeconds,
      rounds: r.rounds,
      total_time: r.totalTime,
      completed_at: r.completedAt,
    }))
  );

  if (error) {
    console.error("Error syncing history:", error);
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function historyRecordToConfig(record: WorkoutRecord) {
  return {
    id: `history-${record.id}`,
    name: record.presetName,
    description: `${record.workSeconds}s work / ${record.restSeconds}s rest × ${record.rounds}`,
    workSeconds: record.workSeconds,
    restSeconds: record.restSeconds,
    rounds: record.rounds,
  };
}

// Helper to convert DB record to local format
function dbRecordToLocal(db: WorkoutHistory): WorkoutRecord {
  return {
    id: db.id,
    presetName: db.workout_name,
    workSeconds: db.work_seconds,
    restSeconds: db.rest_seconds,
    rounds: db.rounds,
    totalTime: db.total_time,
    completedAt: db.completed_at,
  };
}
