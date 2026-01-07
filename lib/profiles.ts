import { createClient } from "@/lib/supabase";
import { Profile, SavedWorkout } from "@/lib/database.types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No profile exists yet
      return null;
    }
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (error) {
    console.error("Error fetching profile by username:", error);
    return null;
  }

  return data;
}

export async function createProfile(
  userId: string,
  username: string,
  displayName?: string
): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      username: username.toLowerCase(),
      display_name: displayName || username,
      is_public: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: {
    username?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    is_public?: boolean;
  }
): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const updateData: Record<string, unknown> = {};
  if (updates.username !== undefined) updateData.username = updates.username.toLowerCase();
  if (updates.display_name !== undefined) updateData.display_name = updates.display_name;
  if (updates.bio !== undefined) updateData.bio = updates.bio;
  if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
  if (updates.is_public !== undefined) updateData.is_public = updates.is_public;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return data;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (error && error.code === "PGRST116") {
    // No match found = available
    return true;
  }

  return !data;
}

// Follow system
export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) {
    if (error.code === "23505") {
      // Already following
      return true;
    }
    console.error("Error following user:", error);
    return false;
  }

  return true;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    console.error("Error unfollowing user:", error);
    return false;
  }

  return true;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  if (error) return false;
  return !!data;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  if (error) return 0;
  return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  if (error) return 0;
  return count || 0;
}

export async function getFollowers(userId: string): Promise<Profile[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, profiles!follows_follower_id_fkey(*)")
    .eq("following_id", userId);

  if (error) {
    console.error("Error fetching followers:", error);
    return [];
  }

  return (data || [])
    .map((r) => r.profiles as unknown as Profile)
    .filter(Boolean);
}

export async function getFollowing(userId: string): Promise<Profile[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("following_id, profiles!follows_following_id_fkey(*)")
    .eq("follower_id", userId);

  if (error) {
    console.error("Error fetching following:", error);
    return [];
  }

  return (data || [])
    .map((r) => r.profiles as unknown as Profile)
    .filter(Boolean);
}

// Get workouts from users you follow
export async function getFollowingWorkouts(
  userId: string,
  limit: number = 20
): Promise<SavedWorkout[]> {
  const supabase = createClient();
  if (!supabase) return [];

  // First get following IDs
  const { data: followingData, error: followingError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (followingError || !followingData?.length) return [];

  const followingIds = followingData.map((f) => f.following_id);

  // Then get their public workouts
  const { data, error } = await supabase
    .from("saved_workouts")
    .select("*")
    .in("user_id", followingIds)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching following workouts:", error);
    return [];
  }

  return data || [];
}

// Search users
export async function searchUsers(query: string, limit: number = 10): Promise<Profile[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_public", true)
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }

  return data || [];
}

