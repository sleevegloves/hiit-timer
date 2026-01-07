export interface SavedWorkout {
  id: string;
  user_id: string;
  name: string;
  work_seconds: number;
  rest_seconds: number;
  rounds: number;
  exercise_names: string[] | null;
  created_at: string;
  updated_at: string;
  // Circuit mode fields
  is_circuit: boolean | null;
  exercises: number | null;
  total_rounds: number | null;
  round_rest_seconds: number | null;
  // Community fields
  is_public: boolean;
  times_used: number;
  description: string | null;
  tags: string[] | null;
  likes_count: number;
}

export interface WorkoutHistory {
  id: string;
  user_id: string;
  workout_name: string;
  work_seconds: number;
  rest_seconds: number;
  rounds: number;
  total_time: number;
  completed_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface WorkoutSave {
  user_id: string;
  workout_id: string;
  created_at: string;
}

export interface WorkoutLike {
  user_id: string;
  workout_id: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      saved_workouts: {
        Row: SavedWorkout;
        Insert: Omit<SavedWorkout, "id" | "created_at" | "updated_at" | "times_used">;
        Update: Partial<Omit<SavedWorkout, "id" | "user_id" | "created_at">>;
      };
      workout_history: {
        Row: WorkoutHistory;
        Insert: Omit<WorkoutHistory, "id">;
        Update: Partial<Omit<WorkoutHistory, "id" | "user_id">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      follows: {
        Row: Follow;
        Insert: Omit<Follow, "created_at">;
        Update: never;
      };
      workout_saves: {
        Row: WorkoutSave;
        Insert: Omit<WorkoutSave, "created_at">;
        Update: never;
      };
      workout_likes: {
        Row: WorkoutLike;
        Insert: Omit<WorkoutLike, "created_at">;
        Update: never;
      };
    };
  };
}
