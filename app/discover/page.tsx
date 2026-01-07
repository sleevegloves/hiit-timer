"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPublicWorkouts,
  searchPublicWorkouts,
  savedWorkoutToConfig,
  saveWorkoutToCollection,
  unsaveWorkoutFromCollection,
  getSavedWorkoutIds,
  likeWorkout,
  unlikeWorkout,
  getLikedWorkoutIds,
  PublicWorkoutWithProfile,
  PublicWorkoutFilters,
  WORKOUT_TAGS,
} from "@/lib/savedWorkouts";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { formatTime, getTotalWorkoutTime } from "@/lib/presets";

// Time filter options
const TIME_FILTERS = [
  { label: "Any", min: undefined, max: undefined },
  { label: "< 10 min", min: undefined, max: 600 },
  { label: "10-20 min", min: 600, max: 1200 },
  { label: "20-30 min", min: 1200, max: 1800 },
  { label: "30+ min", min: 1800, max: undefined },
] as const;

export default function DiscoverPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [workouts, setWorkouts] = useState<PublicWorkoutWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [usernameFilter, setUsernameFilter] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "likes">("popular");

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    const filters: PublicWorkoutFilters = {
      minTime: TIME_FILTERS[selectedTimeFilter].min,
      maxTime: TIME_FILTERS[selectedTimeFilter].max,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      username: usernameFilter || undefined,
      sortBy,
    };
    const data = searchQuery
      ? await searchPublicWorkouts(searchQuery)
      : await getPublicWorkouts(50, 0, filters);
    setWorkouts(data);
    setLoading(false);
  }, [searchQuery, selectedTimeFilter, selectedTags, usernameFilter, sortBy]);

  const fetchSavedIds = useCallback(async () => {
    if (user?.id) {
      const ids = await getSavedWorkoutIds(user.id);
      setSavedIds(ids);
    }
  }, [user?.id]);

  const fetchLikedIds = useCallback(async () => {
    if (user?.id) {
      const ids = await getLikedWorkoutIds(user.id);
      setLikedIds(ids);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  useEffect(() => {
    fetchSavedIds();
    fetchLikedIds();
  }, [fetchSavedIds, fetchLikedIds]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkouts();
  };

  const handleStartWorkout = (workout: PublicWorkoutWithProfile) => {
    const config = savedWorkoutToConfig(workout);
    sessionStorage.setItem("hiit-workout-config", JSON.stringify(config));
    router.push("/timer");
  };

  const handleToggleSave = async (workoutId: string) => {
    if (!user?.id) return;

    if (savedIds.has(workoutId)) {
      await unsaveWorkoutFromCollection(user.id, workoutId);
      setSavedIds(prev => {
        const next = new Set(prev);
        next.delete(workoutId);
        return next;
      });
    } else {
      await saveWorkoutToCollection(user.id, workoutId);
      setSavedIds(prev => new Set(prev).add(workoutId));
    }
  };

  const handleToggleLike = async (workoutId: string) => {
    if (!user?.id) return;

    const isLiked = likedIds.has(workoutId);

    // Optimistic update
    setLikedIds(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });

    // Update likes_count locally
    setWorkouts(prev =>
      prev.map(w =>
        w.id === workoutId
          ? { ...w, likes_count: w.likes_count + (isLiked ? -1 : 1) }
          : w
      )
    );

    // API call
    if (isLiked) {
      await unlikeWorkout(user.id, workoutId);
    } else {
      await likeWorkout(user.id, workoutId);
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTimeFilter(0);
    setSelectedTags([]);
    setUsernameFilter("");
    setSortBy("popular");
  };

  const hasActiveFilters = selectedTimeFilter !== 0 || selectedTags.length > 0 || usernameFilter;

  return (
    <main className="min-h-screen p-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Discover</h1>
            <p className="text-sm text-muted-foreground">Find workouts from the community</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </header>

      {/* Search & Filters */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workouts..."
              className="w-full px-5 py-4 pl-12 pr-24 rounded-2xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-accent transition-colors"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-colors ${
                  showFilters || hasActiveFilters
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-5 rounded-2xl bg-card border-2 border-border space-y-5">
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
              <div className="flex gap-2">
                {[
                  { value: "popular", label: "Most Used" },
                  { value: "likes", label: "Most Liked" },
                  { value: "recent", label: "Recent" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortBy(opt.value as typeof sortBy)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      sortBy === opt.value
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Duration</label>
              <div className="flex flex-wrap gap-2">
                {TIME_FILTERS.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTimeFilter(idx)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      selectedTimeFilter === idx
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {WORKOUT_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTagFilter(tag)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Creator</label>
              <input
                type="text"
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
                placeholder="Filter by username..."
                className="w-full px-4 py-2.5 rounded-xl bg-background border-2 border-border text-foreground focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full py-2.5 rounded-xl bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {selectedTimeFilter !== 0 && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent">
                {TIME_FILTERS[selectedTimeFilter].label}
              </span>
            )}
            {selectedTags.map(tag => (
              <span key={tag} className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent">
                {tag}
              </span>
            ))}
            {usernameFilter && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent">
                @{usernameFilter}
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Loading workouts...</div>
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No workouts found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Be the first to share a workout!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workouts.map((workout) => {
            const config = savedWorkoutToConfig(workout);
            const totalTime = getTotalWorkoutTime(config);
            const isSaved = savedIds.has(workout.id);
            const isLiked = likedIds.has(workout.id);

            return (
              <div
                key={workout.id}
                className="p-5 rounded-2xl bg-card border-2 border-border hover:border-accent/50 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{workout.name}</h3>
                    {workout.owner_username && (
                      <Link
                        href={`/user/${workout.owner_username}`}
                        className="text-xs text-accent hover:underline"
                      >
                        @{workout.owner_username}
                      </Link>
                    )}
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted text-muted-foreground ml-3 shrink-0">
                    {formatTime(totalTime)}
                  </span>
                </div>

                {/* Description - fixed height area */}
                <div className="min-h-[2.5rem] mb-2">
                  {workout.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{workout.description}</p>
                  )}
                </div>

                {/* Tags - fixed height area */}
                <div className="min-h-[1.75rem] mb-3">
                  {workout.tags && workout.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {workout.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-accent/10 text-accent"
                        >
                          {tag}
                        </span>
                      ))}
                      {workout.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                          +{workout.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Spacer to push content to bottom */}
                <div className="flex-1" />

                <div className="flex gap-4 text-xs font-mono mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-work" />
                    <span className="text-foreground">{workout.work_seconds}s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rest" />
                    <span className="text-foreground">{workout.rest_seconds}s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">×</span>
                    <span className="text-foreground">{workout.rounds}</span>
                  </div>
                  {workout.times_used > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>{workout.times_used}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleStartWorkout(workout)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-all"
                  >
                    Start Workout
                  </button>

                  {/* Like Button */}
                  <button
                    onClick={() => user ? handleToggleLike(workout.id) : undefined}
                    disabled={!user}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 transition-all ${
                      isLiked
                        ? "bg-red-500/10 border-red-500/50 text-red-500"
                        : "bg-card border-border text-muted-foreground hover:border-red-500/30 hover:text-red-500"
                    } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={user ? (isLiked ? "Unlike" : "Like") : "Sign in to like"}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isLiked ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    {workout.likes_count > 0 && (
                      <span className="text-xs font-medium">{workout.likes_count}</span>
                    )}
                  </button>

                  {/* Save Button */}
                  {user && (
                    <button
                      onClick={() => handleToggleSave(workout.id)}
                      className={`p-2.5 rounded-xl border-2 transition-all ${
                        isSaved
                          ? "bg-accent/10 border-accent text-accent"
                          : "bg-card border-border text-muted-foreground hover:border-accent/50 hover:text-accent"
                      }`}
                      title={isSaved ? "Remove from collection" : "Save to collection"}
                    >
                      <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating nav hint */}
      {!user && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-card border border-border shadow-lg">
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="text-accent font-medium hover:underline">Sign in</Link>
            {" "}to save workouts to your collection
          </p>
        </div>
      )}
    </main>
  );
}

