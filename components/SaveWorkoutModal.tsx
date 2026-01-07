"use client";

import { useState, useEffect } from "react";
import { WorkoutConfig } from "@/lib/presets";
import { saveWorkout, updateWorkout, WORKOUT_TAGS } from "@/lib/savedWorkouts";
import { useAuth } from "@/components/AuthProvider";

interface SaveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutConfig;
  onSaved: (savedWorkoutId: string, savedName: string) => void;
  editingId?: string | null;
  editingName?: string | null;
  initialIsPublic?: boolean;
  initialTags?: string[];
  initialDescription?: string;
}

export function SaveWorkoutModal({
  isOpen,
  onClose,
  workout,
  onSaved,
  editingId,
  editingName,
  initialIsPublic,
  initialTags,
  initialDescription,
}: SaveWorkoutModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingId;

  // Pre-fill form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set name
      if (editingName) {
        setName(editingName);
      } else if (workout.name && !workout.name.startsWith("Custom")) {
        setName(workout.name);
      } else {
        setName("");
      }
      // Set other fields from initial values
      setIsPublic(initialIsPublic ?? false);
      setSelectedTags(initialTags ?? []);
      setDescription(initialDescription ?? "");
      setError(null);
    }
  }, [isOpen]); // Only re-run when modal opens/closes

  if (!isOpen || !user) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5
          ? [...prev, tag]
          : prev
    );
  };

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
      result = await updateWorkout(editingId, name.trim(), workout, isPublic, description.trim() || undefined, selectedTags);
    } else {
      result = await saveWorkout(user.id, name.trim(), workout, isPublic, description.trim() || undefined, selectedTags);
    }

    if (result) {
      onSaved(result.id, name.trim());
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-accent transition-colors resize-none"
              placeholder="What's this workout good for?"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Tags <span className="text-muted-foreground font-normal">(up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  } ${
                    !selectedTags.includes(tag) && selectedTags.length >= 5
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={!selectedTags.includes(tag) && selectedTags.length >= 5}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border-2 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-foreground block">Share with Community</span>
                <span className="text-xs text-muted-foreground">Others can discover and use this workout</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
                isPublic ? "bg-accent" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
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
