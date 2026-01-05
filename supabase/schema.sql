-- HIIT Timer Database Schema
-- Run this in your Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.saved_workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    work_seconds INTEGER NOT NULL CHECK (work_seconds >= 1 AND work_seconds <= 600),
    rest_seconds INTEGER NOT NULL CHECK (rest_seconds >= 0 AND rest_seconds <= 600),
    rounds INTEGER NOT NULL CHECK (rounds >= 1 AND rounds <= 99),
    exercise_names TEXT[] DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_workouts_user_id_idx ON public.saved_workouts(user_id);

ALTER TABLE public.saved_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts"
    ON public.saved_workouts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
    ON public.saved_workouts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
    ON public.saved_workouts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
    ON public.saved_workouts
    FOR DELETE
    USING (auth.uid() = user_id);

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

