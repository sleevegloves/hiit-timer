"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PRESETS, WorkoutConfig, createCustomWorkout, formatTime, getTotalWorkoutTime } from "@/lib/presets";
import { getHistory, WorkoutRecord, formatDuration, formatRelativeTime } from "@/lib/history";
import { getSavedWorkouts, deleteWorkout, savedWorkoutToConfig } from "@/lib/savedWorkouts";
import { SavedWorkout } from "@/lib/database.types";
import { PresetCard } from "@/components/PresetCard";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { AuthModal } from "@/components/AuthModal";
import { SaveWorkoutModal } from "@/components/SaveWorkoutModal";

export default function HomePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const customSectionRef = useRef<HTMLDivElement>(null);

  const [selectedPreset, setSelectedPreset] = useState<WorkoutConfig | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customWork, setCustomWork] = useState(30);
  const [customRest, setCustomRest] = useState(15);
  const [customRounds, setCustomRounds] = useState(8);
  const [customExerciseNames, setCustomExerciseNames] = useState<string[]>([]);
  const [showExerciseNames, setShowExerciseNames] = useState(false);
  const [history, setHistory] = useState<WorkoutRecord[]>([]);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const fetchSavedWorkouts = useCallback(async () => {
    if (!user) {
      setSavedWorkouts([]);
      return;
    }
    setLoadingSaved(true);
    const workouts = await getSavedWorkouts(user.id);
    setSavedWorkouts(workouts);
    setLoadingSaved(false);
  }, [user]);

  useEffect(() => {
    fetchSavedWorkouts();
  }, [fetchSavedWorkouts]);

  useEffect(() => {
    if (customExerciseNames.length < customRounds) {
      setCustomExerciseNames((prev) => [
        ...prev,
        ...Array(customRounds - prev.length).fill(""),
      ]);
    } else if (customExerciseNames.length > customRounds) {
      setCustomExerciseNames((prev) => prev.slice(0, customRounds));
    }
  }, [customRounds, customExerciseNames.length]);

  const handleSelectPreset = (preset: WorkoutConfig) => {
    setSelectedPreset(preset);
    setShowCustom(false);
    setEditingWorkoutId(null);
  };

  const updateCustomWorkout = (
    work = customWork,
    rest = customRest,
    rounds = customRounds,
    names = customExerciseNames
  ) => {
    setSelectedPreset(createCustomWorkout(work, rest, rounds, names));
  };

  const handleCustomSelect = () => {
    setShowCustom(true);
    updateCustomWorkout();
  };

  // Load a workout config into the custom form
  const loadIntoCustomForm = (config: WorkoutConfig, workoutId?: string) => {
    setCustomWork(config.workSeconds);
    setCustomRest(config.restSeconds);
    setCustomRounds(config.rounds);
    setCustomExerciseNames(config.exerciseNames || Array(config.rounds).fill(""));
    setShowCustom(true);
    setEditingWorkoutId(workoutId || null);

    // Show exercise names if there are any
    if (config.exerciseNames && config.exerciseNames.some(n => n)) {
      setShowExerciseNames(true);
    }

    // Update selected preset
    setSelectedPreset(createCustomWorkout(
      config.workSeconds,
      config.restSeconds,
      config.rounds,
      config.exerciseNames || []
    ));

    // Scroll to custom section
    setTimeout(() => {
      customSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleUseAsTemplate = (preset: WorkoutConfig) => {
    loadIntoCustomForm(preset);
  };

  const handleEditSavedWorkout = (saved: SavedWorkout) => {
    const config = savedWorkoutToConfig(saved);
    loadIntoCustomForm(config, saved.id);
  };

  const handleExerciseNameChange = (index: number, name: string) => {
    const updated = [...customExerciseNames];
    updated[index] = name;
    setCustomExerciseNames(updated);
    if (showCustom) {
      updateCustomWorkout(customWork, customRest, customRounds, updated);
    }
  };

  const handleStartWorkout = () => {
    if (!selectedPreset) return;
    sessionStorage.setItem("hiit-workout-config", JSON.stringify(selectedPreset));
    router.push("/timer");
  };

  const handleSaveWorkout = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowSaveModal(true);
  };

  const handleDeleteSavedWorkout = async (workoutId: string) => {
    const confirmed = window.confirm("Delete this saved workout?");
    if (!confirmed) return;

    const success = await deleteWorkout(workoutId);
    if (success) {
      fetchSavedWorkouts();
      if (editingWorkoutId === workoutId) {
        setEditingWorkoutId(null);
      }
    }
  };

  const customPreview = createCustomWorkout(customWork, customRest, customRounds, customExerciseNames);

  return (
    <main className="min-h-screen p-6 pb-40 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">HIIT Timer</h1>
          <p className="text-muted-foreground mt-1">
            {user ? `Welcome, ${user.email?.split("@")[0]}` : "Choose a workout to begin"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!authLoading && (
            user ? (
              <button
                onClick={() => signOut()}
                className="px-4 py-2.5 text-sm font-medium rounded-xl bg-card border border-border hover:bg-muted transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl bg-accent text-accent-foreground hover:opacity-90 transition-colors shadow-sm"
              >
                Sign In
              </button>
            )
          )}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {user && savedWorkouts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Your Saved Workouts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedWorkouts.map((saved) => {
              const config = savedWorkoutToConfig(saved);
              return (
                <PresetCard
                  key={saved.id}
                  preset={config}
                  onSelect={handleSelectPreset}
                  onEdit={() => handleEditSavedWorkout(saved)}
                  onDelete={() => handleDeleteSavedWorkout(saved.id)}
                  selected={!showCustom && selectedPreset?.id === config.id}
                />
              );
            })}
          </div>
        </section>
      )}

      {user && loadingSaved && (
        <section className="mb-10">
          <div className="animate-pulse text-muted-foreground text-sm">Loading saved workouts...</div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Presets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onSelect={handleSelectPreset}
              onUseAsTemplate={handleUseAsTemplate}
              selected={!showCustom && selectedPreset?.id === preset.id}
            />
          ))}
        </div>
      </section>

      <section className="mb-10" ref={customSectionRef}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Custom Workout
          {editingWorkoutId && (
            <span className="ml-2 text-accent">(Editing)</span>
          )}
        </h2>
        <div
          onClick={handleCustomSelect}
          className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
            showCustom
              ? "border-accent bg-accent/20 ring-4 ring-accent/40"
              : "border-border bg-card hover:border-accent/50 hover:bg-accent/5"
          }`}
        >
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Work (sec)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={customWork}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCustomWork(val);
                  if (showCustom) {
                    updateCustomWorkout(val, customRest, customRounds, customExerciseNames);
                  }
                }}
                onFocus={handleCustomSelect}
                className="w-full px-3 py-2.5 rounded-xl bg-background border-2 border-border text-foreground font-mono text-center focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Rest (sec)</label>
              <input
                type="number"
                min={0}
                max={300}
                value={customRest}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCustomRest(val);
                  if (showCustom) {
                    updateCustomWorkout(customWork, val, customRounds, customExerciseNames);
                  }
                }}
                onFocus={handleCustomSelect}
                className="w-full px-3 py-2.5 rounded-xl bg-background border-2 border-border text-foreground font-mono text-center focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Rounds</label>
              <input
                type="number"
                min={1}
                max={99}
                value={customRounds}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCustomRounds(val);
                  if (showCustom) {
                    updateCustomWorkout(customWork, customRest, val, customExerciseNames);
                  }
                }}
                onFocus={handleCustomSelect}
                className="w-full px-3 py-2.5 rounded-xl bg-background border-2 border-border text-foreground font-mono text-center focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowExerciseNames(!showExerciseNames);
            }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showExerciseNames ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Name each round (optional)
          </button>

          {showExerciseNames && (
            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto pr-2" onClick={(e) => e.stopPropagation()}>
              {Array.from({ length: customRounds }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6 text-right font-mono">{i + 1}.</span>
                  <input
                    type="text"
                    value={customExerciseNames[i] || ""}
                    onChange={(e) => handleExerciseNameChange(i, e.target.value)}
                    placeholder={`Round ${i + 1} exercise`}
                    className="flex-1 px-3 py-2 rounded-xl bg-background border-2 border-border text-foreground text-sm focus:outline-none focus:border-accent placeholder:text-muted-foreground/50 transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Total time</span>
            <span className="font-mono text-foreground font-medium">
              {formatTime(getTotalWorkoutTime(customPreview))}
            </span>
          </div>

          {showCustom && (
            <div className="flex gap-3 mt-5">
              {editingWorkoutId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingWorkoutId(null);
                    setCustomWork(30);
                    setCustomRest(15);
                    setCustomRounds(8);
                    setCustomExerciseNames([]);
                    setShowExerciseNames(false);
                    updateCustomWorkout(30, 15, 8, []);
                  }}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-muted-foreground font-semibold hover:bg-muted transition-colors"
                >
                  Cancel Edit
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveWorkout();
                }}
                className="flex-1 py-3 rounded-xl border-2 border-accent text-accent font-semibold hover:bg-accent/10 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {user ? (editingWorkoutId ? "Update Workout" : "Save Workout") : "Sign In to Save"}
              </button>
            </div>
          )}
        </div>
      </section>

      {history.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Recent Workouts
          </h2>
          <div className="space-y-3">
            {history.slice(0, 5).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
              >
                <div>
                  <span className="font-semibold text-foreground">{record.presetName}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {record.workSeconds}s/{record.restSeconds}s × {record.rounds}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm text-foreground">
                    {formatDuration(record.totalTime)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatRelativeTime(record.completedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fixed bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <button
            onClick={handleStartWorkout}
            disabled={!selectedPreset}
            className={`
              w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all
              ${
                selectedPreset
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-lg shadow-emerald-500/30"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }
            `}
          >
            {selectedPreset ? `Start ${selectedPreset.name}` : "Select a workout"}
          </button>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {selectedPreset && (
        <SaveWorkoutModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          workout={selectedPreset}
          onSaved={() => {
            fetchSavedWorkouts();
            setEditingWorkoutId(null);
          }}
          editingId={editingWorkoutId}
        />
      )}
    </main>
  );
}
