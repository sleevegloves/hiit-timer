-- HIIT Timer Database Schema
-- Run this in your Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- SAVED WORKOUTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.saved_workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    work_seconds INTEGER NOT NULL CHECK (work_seconds >= 1 AND work_seconds <= 600),
    rest_seconds INTEGER NOT NULL CHECK (rest_seconds >= 0 AND rest_seconds <= 600),
    rounds INTEGER NOT NULL CHECK (rounds >= 1 AND rounds <= 99),
    exercise_names TEXT[] DEFAULT NULL,
    -- Circuit mode fields
    is_circuit BOOLEAN DEFAULT false,
    exercises INTEGER DEFAULT NULL,
    total_rounds INTEGER DEFAULT NULL,
    round_rest_seconds INTEGER DEFAULT NULL,
    -- Community fields
    is_public BOOLEAN DEFAULT false,
    times_used INTEGER DEFAULT 0,
    description TEXT DEFAULT NULL,
    tags TEXT[] DEFAULT NULL,
    likes_count INTEGER DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_workouts_user_id_idx ON public.saved_workouts(user_id);
CREATE INDEX IF NOT EXISTS saved_workouts_is_public_idx ON public.saved_workouts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS saved_workouts_times_used_idx ON public.saved_workouts(times_used DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS saved_workouts_tags_idx ON public.saved_workouts USING GIN(tags) WHERE is_public = true;

-- ===========================================
-- WORKOUT HISTORY TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.workout_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_name VARCHAR(100) NOT NULL,
    work_seconds INTEGER NOT NULL,
    rest_seconds INTEGER NOT NULL,
    rounds INTEGER NOT NULL,
    total_time INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workout_history_user_id_idx ON public.workout_history(user_id);
CREATE INDEX IF NOT EXISTS workout_history_completed_at_idx ON public.workout_history(completed_at DESC);

-- ===========================================
-- USER PROFILES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE,
    display_name VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- ===========================================
-- FOLLOWS TABLE (Social Graph)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);

-- ===========================================
-- WORKOUT SAVES TABLE (Save others' workouts)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.workout_saves (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.saved_workouts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, workout_id)
);

CREATE INDEX IF NOT EXISTS workout_saves_user_idx ON public.workout_saves(user_id);
CREATE INDEX IF NOT EXISTS workout_saves_workout_idx ON public.workout_saves(workout_id);

-- ===========================================
-- WORKOUT LIKES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.workout_likes (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.saved_workouts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, workout_id)
);

CREATE INDEX IF NOT EXISTS workout_likes_user_idx ON public.workout_likes(user_id);
CREATE INDEX IF NOT EXISTS workout_likes_workout_idx ON public.workout_likes(workout_id);

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Saved Workouts
ALTER TABLE public.saved_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts"
    ON public.saved_workouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public workouts"
    ON public.saved_workouts FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can insert own workouts"
    ON public.saved_workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
    ON public.saved_workouts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
    ON public.saved_workouts FOR DELETE
    USING (auth.uid() = user_id);

-- Workout History
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
    ON public.workout_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
    ON public.workout_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
    ON public.workout_history FOR DELETE
    USING (auth.uid() = user_id);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Anyone can view public profiles"
    ON public.profiles FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);

-- Workout Saves
ALTER TABLE public.workout_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saves"
    ON public.workout_saves FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save workouts"
    ON public.workout_saves FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave workouts"
    ON public.workout_saves FOR DELETE
    USING (auth.uid() = user_id);

-- Workout Likes
ALTER TABLE public.workout_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own likes"
    ON public.workout_likes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view like counts"
    ON public.workout_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like workouts"
    ON public.workout_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike workouts"
    ON public.workout_likes FOR DELETE
    USING (auth.uid() = user_id);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS saved_workouts_updated_at ON public.saved_workouts;
CREATE TRIGGER saved_workouts_updated_at
    BEFORE UPDATE ON public.saved_workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Increment workout usage counter
CREATE OR REPLACE FUNCTION public.increment_workout_usage(workout_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.saved_workouts
    SET times_used = times_used + 1
    WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update likes count when a like is added
CREATE OR REPLACE FUNCTION public.handle_workout_like()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.saved_workouts
    SET likes_count = likes_count + 1
    WHERE id = NEW.workout_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update likes count when a like is removed
CREATE OR REPLACE FUNCTION public.handle_workout_unlike()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.saved_workouts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.workout_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workout_like ON public.workout_likes;
CREATE TRIGGER on_workout_like
    AFTER INSERT ON public.workout_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_workout_like();

DROP TRIGGER IF EXISTS on_workout_unlike ON public.workout_likes;
CREATE TRIGGER on_workout_unlike
    AFTER DELETE ON public.workout_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_workout_unlike();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
