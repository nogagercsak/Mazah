-- =============================================
-- Database Setup for Mazah Food Management App
-- =============================================

-- -----------------------------
-- 1. Cleanup existing objects
-- -----------------------------

-- Drop existing tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.meal_ingredients CASCADE;
DROP TABLE IF EXISTS public.meal_plans CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.food_items CASCADE;
DROP TABLE IF EXISTS public.ingredients CASCADE;

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

-- Create ingredients reference table first (no dependencies)
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    co2_per_kg DECIMAL(10,2) NOT NULL, -- CO2 emissions per kg
    water_per_kg DECIMAL(10,2) NOT NULL, -- Water usage per kg
    standard_unit TEXT NOT NULL, -- e.g., 'kg', 'g', 'ml', 'l'
    conversion_to_kg DECIMAL(10,4) NOT NULL, -- conversion factor to kg
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
    ingredient_id UUID NOT NULL,
    food_item_id UUID REFERENCES public.food_items(id) ON DELETE SET NULL, -- Reference to inventory item
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    CONSTRAINT fk_meal
        FOREIGN KEY(meal_id)
        REFERENCES public.meals(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ingredient
        FOREIGN KEY(ingredient_id)
        REFERENCES public.ingredients(id)
        ON DELETE RESTRICT
);

-- Create food_items table
CREATE TABLE public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    remaining_quantity DECIMAL(10,2) NOT NULL, -- Track remaining quantity numerically
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
CREATE INDEX idx_meal_ingredients_ingredient_id ON public.meal_ingredients(ingredient_id);
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
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- -----------------------------
-- 6. Create RLS Policies
-- -----------------------------

-- Ingredients policies (viewable by all authenticated users)
CREATE POLICY "Authenticated users can view ingredients" ON public.ingredients
    FOR SELECT USING (auth.role() = 'authenticated');

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

CREATE TRIGGER update_ingredients_updated_at 
    BEFORE UPDATE ON public.ingredients 
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

-- Add some sample ingredient data
INSERT INTO public.ingredients (name, category, co2_per_kg, water_per_kg, standard_unit, conversion_to_kg) VALUES
    ('Beef', 'Meat', 60.0, 15400, 'kg', 1.0),
    ('Chicken', 'Meat', 6.9, 4325, 'kg', 1.0),
    ('Rice', 'Grain', 2.7, 2500, 'kg', 1.0),
    ('Potatoes', 'Vegetable', 0.4, 287, 'kg', 1.0),
    ('Tomatoes', 'Vegetable', 1.4, 214, 'kg', 1.0),
    ('Milk', 'Dairy', 3.2, 1020, 'l', 1.03),
    ('Eggs', 'Dairy', 4.8, 3265, 'unit', 0.05),
    ('Bread', 'Grain', 1.3, 1608, 'kg', 1.0),
    ('Lettuce', 'Vegetable', 0.2, 237, 'kg', 1.0),
    ('Cheese', 'Dairy', 13.5, 5060, 'kg', 1.0);

-- Add remaining_quantity column to food_items
ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS remaining_quantity DECIMAL(10,2);

-- Update existing rows to set remaining_quantity based on quantity
-- First, create a function to extract numeric value from quantity text
CREATE OR REPLACE FUNCTION extract_numeric(text) RETURNS numeric AS $$
DECLARE
    n numeric = 0;
BEGIN
    -- Extract first number from text (handles cases like '500g', '2 kg', '1.5L', etc.)
    SELECT (regexp_matches($1, '(\d+\.?\d*)'))[1]::numeric INTO n;
    RETURN n;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Update existing rows
UPDATE public.food_items
SET remaining_quantity = extract_numeric(quantity)
WHERE remaining_quantity IS NULL;

-- Make remaining_quantity NOT NULL after setting initial values
ALTER TABLE public.food_items
ALTER COLUMN remaining_quantity SET NOT NULL;

-- Drop the helper function as it's no longer needed
DROP FUNCTION IF EXISTS extract_numeric(text); 