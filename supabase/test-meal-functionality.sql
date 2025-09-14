-- =============================================
-- Test Script for Add Meal Functionality
-- =============================================

-- Test 1: Check ingredients table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ingredients' 
ORDER BY ordinal_position;

-- Test 2: Check if global ingredients exist
SELECT COUNT(*) as global_ingredients_count
FROM public.ingredients 
WHERE is_global = true;

-- Test 3: List available ingredients
SELECT id, name, category, standard_unit, is_global
FROM public.ingredients 
WHERE is_global = true
ORDER BY category, name
LIMIT 10;

-- Test 4: Check meals table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meals' 
ORDER BY ordinal_position;

-- Test 5: Check meal_plans table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meal_plans' 
ORDER BY ordinal_position;

-- Test 6: Check meal_ingredients table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meal_ingredients' 
ORDER BY ordinal_position;

-- Test 7: Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('ingredients', 'meals', 'meal_plans', 'meal_ingredients')
ORDER BY tablename, policyname;