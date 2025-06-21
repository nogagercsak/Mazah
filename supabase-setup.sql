-- =============================================
-- Database Setup for Mazah Food Management App
-- =============================================

-- -----------------------------
-- 1. Cleanup existing objects
-- -----------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can insert own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can update own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can delete own food items" ON public.food_items;

DROP POLICY IF EXISTS "Users can view own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can insert own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can update own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can delete own meals" ON public.meals;

DROP POLICY IF EXISTS "Users can view own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can insert own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete own meal plans" ON public.meal_plans;

DROP POLICY IF EXISTS "Users can view meal ingredients" ON public.meal_ingredients;
DROP POLICY IF EXISTS "Users can insert meal ingredients" ON public.meal_ingredients;
DROP POLICY IF EXISTS "Users can update meal ingredients" ON public.meal_ingredients;
DROP POLICY IF EXISTS "Users can delete meal ingredients" ON public.meal_ingredients;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_food_items_updated_at ON public.food_items;
DROP TRIGGER IF EXISTS update_meals_updated_at ON public.meals;
DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON public.meal_plans;
DROP TRIGGER IF EXISTS update_meal_ingredients_updated_at ON public.meal_ingredients;

-- Drop existing tables in correct order
DROP TABLE IF EXISTS public.meal_ingredients;
DROP TABLE IF EXISTS public.meal_plans;
DROP TABLE IF EXISTS public.meals;
DROP TABLE IF EXISTS public.food_items;

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

-- Create meals table (no dependencies)
CREATE TABLE public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create meal_plans table
CREATE TABLE public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    meal_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
    CONSTRAINT fk_meal
        FOREIGN KEY(meal_id) 
        REFERENCES public.meals(id)
        ON DELETE CASCADE
);

-- Create meal_ingredients table
CREATE TABLE public.meal_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    meal_id UUID NOT NULL,
    name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    category TEXT NOT NULL,
    CONSTRAINT fk_meal
        FOREIGN KEY(meal_id)
        REFERENCES public.meals(id)
        ON DELETE CASCADE
);

-- Create food_items table
CREATE TABLE public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    expiration_date DATE NOT NULL,
    storage_location TEXT CHECK (storage_location IN ('fridge', 'pantry', 'freezer')) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- -----------------------------
-- 4. Create indexes
-- -----------------------------

CREATE INDEX idx_meals_user_id ON public.meals(user_id);
CREATE INDEX idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX idx_meal_plans_date ON public.meal_plans(date);
CREATE INDEX idx_meal_ingredients_meal_id ON public.meal_ingredients(meal_id);
CREATE INDEX idx_food_items_user_id ON public.food_items(user_id);
CREATE INDEX idx_food_items_storage_location ON public.food_items(storage_location);
CREATE INDEX idx_food_items_expiration_date ON public.food_items(expiration_date);

-- -----------------------------
-- 5. Enable Row Level Security
-- -----------------------------

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

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

-- Food items policies
CREATE POLICY "Users can view own food items" ON public.food_items
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food items" ON public.food_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food items" ON public.food_items
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food items" ON public.food_items
    FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------
-- 7. Create Triggers
-- -----------------------------

CREATE TRIGGER update_meals_updated_at 
    BEFORE UPDATE ON public.meals
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at 
    BEFORE UPDATE ON public.meal_plans
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_ingredients_updated_at 
    BEFORE UPDATE ON public.meal_ingredients
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at 
    BEFORE UPDATE ON public.food_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - for testing)
-- INSERT INTO public.food_items (name, quantity, expiration_date, storage_location, user_id) VALUES
--   ('Milk', '1L', '2024-01-15', 'fridge', '00000000-0000-0000-0000-000000000000'),
--   ('Yogurt', '500g', '2024-01-12', 'fridge', '00000000-0000-0000-0000-000000000000'),
--   ('Cheese', '200g', '2024-01-20', 'fridge', '00000000-0000-0000-0000-000000000000'),
--   ('Pasta', '500g', '2024-06-15', 'pantry', '00000000-0000-0000-0000-000000000000'),
--   ('Rice', '1kg', '2024-08-20', 'pantry', '00000000-0000-0000-0000-000000000000'),
--   ('Chicken Breast', '1kg', '2024-03-15', 'freezer', '00000000-0000-0000-0000-000000000000'); 