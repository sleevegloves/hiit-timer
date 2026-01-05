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
}

export interface Database {
  public: {
    Tables: {
      saved_workouts: {
        Row: SavedWorkout;
        Insert: Omit<SavedWorkout, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SavedWorkout, "id" | "user_id" | "created_at">>;
      };
    };
  };
}

