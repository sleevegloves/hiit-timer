"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getProfileByUsername, followUser, unfollowUser, isFollowing, getFollowerCount, getFollowingCount } from "@/lib/profiles";
import { getPublicWorkouts, savedWorkoutToConfig } from "@/lib/savedWorkouts";
import { Profile, SavedWorkout } from "@/lib/database.types";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { formatTime, getTotalWorkoutTime } from "@/lib/presets";
import { createClient } from "@/lib/supabase";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const profileData = await getProfileByUsername(username);
    setProfile(profileData);

    if (profileData) {
      // Fetch user's public workouts
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase
          .from("saved_workouts")
          .select("*")
          .eq("user_id", profileData.id)
          .eq("is_public", true)
          .order("times_used", { ascending: false });
        setWorkouts(data || []);
      }

      // Fetch follow counts
      const [followers, followingCnt] = await Promise.all([
        getFollowerCount(profileData.id),
        getFollowingCount(profileData.id),
      ]);
      setFollowerCount(followers);
      setFollowingCount(followingCnt);

      // Check if current user is following
      if (user?.id && user.id !== profileData.id) {
        const isFollow = await isFollowing(user.id, profileData.id);
        setFollowing(isFollow);
      }
    }

    setLoading(false);
  }, [username, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleToggleFollow = async () => {
    if (!user?.id || !profile?.id) return;
    setFollowLoading(true);

    if (following) {
      await unfollowUser(user.id, profile.id);
      setFollowing(false);
      setFollowerCount((c) => c - 1);
    } else {
      await followUser(user.id, profile.id);
      setFollowing(true);
      setFollowerCount((c) => c + 1);
    }

    setFollowLoading(false);
  };

  const handleStartWorkout = (workout: SavedWorkout) => {
    const config = savedWorkoutToConfig(workout);
    sessionStorage.setItem("hiit-workout-config", JSON.stringify(config));
    router.push("/timer");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">User not found</h1>
        <p className="text-muted-foreground mb-6">@{username} doesn&apos;t exist or is private</p>
        <Link
          href="/discover"
          className="px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all"
        >
          Discover Workouts
        </Link>
      </main>
    );
  }

  const displayName = profile.display_name || profile.username || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const isOwnProfile = user?.id === profile.id;

  return (
    <main className="min-h-screen p-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
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

      {/* Profile Card */}
      <div className="bg-card border-2 border-border rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-2xl font-bold">
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{displayName}</h1>
            {profile.username && (
              <p className="text-muted-foreground">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="text-foreground mt-2">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div>
                <span className="font-bold text-foreground">{workouts.length}</span>
                <span className="text-muted-foreground text-sm ml-1">workouts</span>
              </div>
              <div>
                <span className="font-bold text-foreground">{followerCount}</span>
                <span className="text-muted-foreground text-sm ml-1">followers</span>
              </div>
              <div>
                <span className="font-bold text-foreground">{followingCount}</span>
                <span className="text-muted-foreground text-sm ml-1">following</span>
              </div>
            </div>
          </div>

          {/* Follow Button */}
          {user && !isOwnProfile && (
            <button
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                following
                  ? "bg-muted text-foreground hover:bg-muted/80"
                  : "bg-accent text-accent-foreground hover:opacity-90"
              }`}
            >
              {followLoading ? "..." : following ? "Following" : "Follow"}
            </button>
          )}

          {isOwnProfile && (
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-all"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Workouts */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Public Workouts
        </h2>

        {workouts.length === 0 ? (
          <div className="text-center py-12 bg-card border-2 border-border rounded-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-muted-foreground">No public workouts yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {workouts.map((workout) => {
              const config = savedWorkoutToConfig(workout);
              const totalTime = getTotalWorkoutTime(config);

              return (
                <div
                  key={workout.id}
                  className="p-5 rounded-2xl bg-card border-2 border-border hover:border-accent/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{workout.name}</h3>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      {formatTime(totalTime)}
                    </span>
                  </div>

                  {workout.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{workout.description}</p>
                  )}

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
                  </div>

                  <button
                    onClick={() => handleStartWorkout(workout)}
                    className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-all"
                  >
                    Start Workout
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

