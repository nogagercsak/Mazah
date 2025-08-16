-- =============================================
-- Database Setup for Mazah Food Management App
-- =============================================

-- -----------------------------
-- 1. Cleanup existing objects
-- -----------------------------

-- Drop existing tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.push_tokens CASCADE;
DROP TABLE IF EXISTS public.meal_ingredients CASCADE;
DROP TABLE IF EXISTS public.meal_plans CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.food_items CASCADE;
DROP TABLE IF EXISTS public.ingredients CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.recipe_ingredients CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;

-- -----------------------------
-- 2. Create utility functions
-- -----------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- -----------------------------
-- 3. Create tables
-- -----------------------------

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  motivation TEXT[] DEFAULT '{}',
  household_size TEXT,
  shopping_frequency TEXT,
  meal_planning_style TEXT[] DEFAULT '{}',
  waste_awareness TEXT,
  success_definition TEXT[] DEFAULT '{}',
  estimated_waste_cost TEXT,
  biggest_challenge TEXT,
  waste_feelings TEXT,
  preferred_cuisines TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  notification_preferences TEXT[] DEFAULT '{}',
  expiration_notifications_enabled BOOLEAN DEFAULT true,
  expiration_notification_days INTEGER[] DEFAULT '{1, 3, 7}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id)
);

-- Create push_tokens table for storing device tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(token)
);

-- Create food_items table
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  quantity TEXT,
  remaining_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  expiration_date DATE,
  storage_location TEXT CHECK (storage_location IN ('fridge', 'pantry', 'freezer')),
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  quantity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create meals table
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create meal_ingredients table
CREATE TABLE IF NOT EXISTS public.meal_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE RESTRICT NOT NULL,
  food_item_id UUID REFERENCES public.food_items(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT[] NOT NULL,
  cooking_time INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  cuisine_type TEXT,
  dietary_restrictions TEXT[] DEFAULT '{}',
  servings INTEGER NOT NULL DEFAULT 4,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create recipe_ingredients table with proper foreign key relationship
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  required BOOLEAN DEFAULT true,
  substitutes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fk_recipe
    FOREIGN KEY(recipe_id) 
    REFERENCES public.recipes(id)
    ON DELETE CASCADE
);

-- -----------------------------
-- 4. Create indexes
-- -----------------------------

CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON public.meal_plans(date);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_meal_id ON public.meal_ingredients(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_ingredient_id ON public.meal_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_food_items_user_id ON public.food_items(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_storage_location ON public.food_items(storage_location);
CREATE INDEX IF NOT EXISTS idx_food_items_expiration_date ON public.food_items(expiration_date);

-- Indexes for recipes and recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_time ON public.recipes(cooking_time);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_type ON public.recipes(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);

-- -----------------------------
-- 5. Enable Row Level Security
-- -----------------------------

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- -----------------------------
-- 6. Create RLS Policies
-- -----------------------------

-- Meals policies
CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Meal plans policies
CREATE POLICY "Users can view own meal plans" ON public.meal_plans
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON public.meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plans" ON public.meal_plans
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plans" ON public.meal_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Meal ingredients policies
CREATE POLICY "Users can view meal ingredients" ON public.meal_ingredients
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.meals
        WHERE meals.id = meal_ingredients.meal_id
        AND meals.user_id = auth.uid()
    ));
CREATE POLICY "Users can insert meal ingredients" ON public.meal_ingredients
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.meals
        WHERE meals.id = meal_ingredients.meal_id
        AND meals.user_id = auth.uid()
    ));
CREATE POLICY "Users can update meal ingredients" ON public.meal_ingredients
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.meals
        WHERE meals.id = meal_ingredients.meal_id
        AND meals.user_id = auth.uid()
    ));
CREATE POLICY "Users can delete meal ingredients" ON public.meal_ingredients
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM public.meals
        WHERE meals.id = meal_ingredients.meal_id
        AND meals.user_id = auth.uid()
    ));

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Food items policies
CREATE POLICY "Users can view own food items" ON public.food_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food items" ON public.food_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food items" ON public.food_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food items" ON public.food_items
    FOR DELETE USING (auth.uid() = user_id);

-- Ingredients policies
CREATE POLICY "Users can view own ingredients" ON public.ingredients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingredients" ON public.ingredients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingredients" ON public.ingredients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ingredients" ON public.ingredients
  FOR DELETE USING (auth.uid() = user_id);

-- Recipes policies
CREATE POLICY "Users can view all recipes" ON public.recipes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own recipes" ON public.recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON public.recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON public.recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe ingredients policies
CREATE POLICY "Users can view all recipe ingredients" ON public.recipe_ingredients
    FOR SELECT USING (true);

CREATE POLICY "Users can modify recipe ingredients" ON public.recipe_ingredients
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.recipes
        WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    ));

-- Push tokens policies
CREATE POLICY "Users can view own push tokens" ON public.push_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens" ON public.push_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens" ON public.push_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens" ON public.push_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------
-- 7. Create Triggers
-- -----------------------------

CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_food_items_updated_at
  BEFORE UPDATE ON public.food_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_ingredients_updated_at
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_meal_ingredients_updated_at
  BEFORE UPDATE ON public.meal_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

