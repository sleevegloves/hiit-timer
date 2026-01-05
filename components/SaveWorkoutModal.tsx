"use client";

import { useState, useEffect } from "react";
import { WorkoutConfig } from "@/lib/presets";
import { saveWorkout, updateWorkout } from "@/lib/savedWorkouts";
import { useAuth } from "@/components/AuthProvider";

interface SaveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutConfig;
  onSaved: () => void;
  editingId?: string | null;
}

export function SaveWorkoutModal({ isOpen, onClose, workout, onSaved, editingId }: SaveWorkoutModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingId;

  // Pre-fill name when editing
  useEffect(() => {
    if (isOpen && workout.name && !workout.name.startsWith("Custom")) {
      setName(workout.name);
    } else if (!isOpen) {
      setName("");
    }
  }, [isOpen, workout.name]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name for your workout");
      return;
    }

    setLoading(true);
    setError(null);

    let result;
    if (isEditing) {
      result = await updateWorkout(editingId, name.trim(), workout);
    } else {
      result = await saveWorkout(user.id, name.trim(), workout);
    }

    if (result) {
      onSaved();
      setName("");
      onClose();
    } else {
      setError(`Failed to ${isEditing ? "update" : "save"} workout. Please try again.`);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-foreground mb-2">
          {isEditing ? "Update Workout" : "Save Workout"}
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          {workout.workSeconds}s work / {workout.restSeconds}s rest × {workout.rounds} rounds
          {workout.exerciseNames && workout.exerciseNames.filter(n => n).length > 0 && (
            <span className="block mt-1 text-accent">
              With {workout.exerciseNames.filter(n => n).length} named exercises
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Workout Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-accent transition-colors"
              placeholder="e.g., Morning Cardio"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update" : "Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
