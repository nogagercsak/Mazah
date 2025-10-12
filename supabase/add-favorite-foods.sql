-- =============================================
-- Migration: Add User Favorite Foods Feature
-- =============================================

-- Create user_favorite_foods table
CREATE TABLE IF NOT EXISTS public.user_favorite_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  storage_location TEXT CHECK (storage_location IN ('fridge', 'pantry', 'freezer')),
  default_quantity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, food_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorite_foods_user_id ON public.user_favorite_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_foods_food_name ON public.user_favorite_foods(food_name);

-- Enable Row Level Security
ALTER TABLE public.user_favorite_foods ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own favorite foods" ON public.user_favorite_foods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite foods" ON public.user_favorite_foods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite foods" ON public.user_favorite_foods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite foods" ON public.user_favorite_foods
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER handle_user_favorite_foods_updated_at
  BEFORE UPDATE ON public.user_favorite_foods
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
