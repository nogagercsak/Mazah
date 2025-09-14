-- =============================================
-- Create Global Ingredients System
-- =============================================

-- First, let's create a system user for global ingredients
-- This would typically be done through the Supabase dashboard or auth system

-- For now, we'll modify the ingredients table to support global ingredients
-- Add a new column to mark ingredients as global/system ingredients

-- Add is_global column to ingredients table
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- Update RLS policies to allow access to global ingredients
DROP POLICY IF EXISTS "Users can view all ingredients" ON public.ingredients;

CREATE POLICY "Users can view all ingredients" ON public.ingredients
  FOR SELECT USING (auth.uid() = user_id OR is_global = true);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_ingredients_is_global ON public.ingredients(is_global);

-- Now insert global ingredients that all users can see
INSERT INTO public.ingredients (name, category, co2_per_kg, water_per_kg, standard_unit, conversion_to_kg, is_global, user_id) 
VALUES 
  -- Proteins
  ('Chicken Breast', 'protein', 6.9, 4325, 'g', 0.001, true, NULL),
  ('Ground Beef', 'protein', 60.0, 15415, 'g', 0.001, true, NULL),
  ('Salmon', 'protein', 11.9, 2303, 'g', 0.001, true, NULL),
  ('Eggs', 'protein', 4.2, 3265, 'piece', 0.06, true, NULL),
  ('Tofu', 'protein', 2.0, 2157, 'g', 0.001, true, NULL),
  
  -- Vegetables
  ('Tomatoes', 'vegetable', 2.3, 214, 'g', 0.001, true, NULL),
  ('Onions', 'vegetable', 0.5, 25, 'g', 0.001, true, NULL),
  ('Carrots', 'vegetable', 0.4, 131, 'g', 0.001, true, NULL),
  ('Bell Peppers', 'vegetable', 0.7, 379, 'g', 0.001, true, NULL),
  ('Spinach', 'vegetable', 2.0, 366, 'g', 0.001, true, NULL),
  ('Broccoli', 'vegetable', 0.4, 287, 'g', 0.001, true, NULL),
  ('Potatoes', 'vegetable', 0.5, 287, 'g', 0.001, true, NULL),
  
  -- Grains & Starches
  ('Rice', 'grain', 2.7, 2497, 'g', 0.001, true, NULL),
  ('Pasta', 'grain', 1.1, 1849, 'g', 0.001, true, NULL),
  ('Bread', 'grain', 0.9, 1608, 'slice', 0.03, true, NULL),
  ('Quinoa', 'grain', 1.9, 4680, 'g', 0.001, true, NULL),
  
  -- Dairy
  ('Milk', 'dairy', 3.2, 1020, 'ml', 0.001, true, NULL),
  ('Cheese', 'dairy', 13.5, 3178, 'g', 0.001, true, NULL),
  ('Yogurt', 'dairy', 2.2, 1118, 'g', 0.001, true, NULL),
  ('Butter', 'dairy', 23.8, 5553, 'g', 0.001, true, NULL),
  
  -- Fruits
  ('Apples', 'fruit', 0.4, 822, 'piece', 0.18, true, NULL),
  ('Bananas', 'fruit', 0.7, 790, 'piece', 0.12, true, NULL),
  ('Lemons', 'fruit', 0.6, 642, 'piece', 0.06, true, NULL),
  ('Oranges', 'fruit', 0.4, 560, 'piece', 0.15, true, NULL),
  
  -- Herbs & Spices
  ('Garlic', 'spice', 0.4, 561, 'clove', 0.003, true, NULL),
  ('Basil', 'herb', 2.1, 1418, 'g', 0.001, true, NULL),
  ('Oregano', 'herb', 0.9, 1551, 'tsp', 0.001, true, NULL),
  ('Black Pepper', 'spice', 3.3, 5865, 'tsp', 0.002, true, NULL),
  ('Salt', 'spice', 0.04, 3.8, 'tsp', 0.006, true, NULL),
  
  -- Oils & Fats
  ('Olive Oil', 'oil', 3.3, 14725, 'tbsp', 0.0135, true, NULL),
  ('Vegetable Oil', 'oil', 3.1, 7692, 'tbsp', 0.0135, true, NULL),
  
  -- Pantry Staples
  ('Sugar', 'pantry', 0.5, 1500, 'tsp', 0.004, true, NULL),
  ('Flour', 'pantry', 0.6, 1440, 'cup', 0.125, true, NULL),
  ('Baking Powder', 'pantry', 0.2, 500, 'tsp', 0.004, true, NULL),
  ('Vanilla Extract', 'pantry', 2.8, 8900, 'tsp', 0.004, true, NULL)
ON CONFLICT (name) DO NOTHING;