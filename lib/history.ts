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

export function getHistory(): WorkoutRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addWorkoutToHistory(
  presetName: string,
  workSeconds: number,
  restSeconds: number,
  rounds: number,
  totalTime: number
): WorkoutRecord {
  const record: WorkoutRecord = {
    id: crypto.randomUUID(),
    presetName,
    workSeconds,
    restSeconds,
    rounds,
    totalTime,
    completedAt: new Date().toISOString(),
  };

  const history = getHistory();
  history.unshift(record);
  const trimmed = history.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return record;
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

