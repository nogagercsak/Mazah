-- Create food_items table for Mazah inventory
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  storage_location TEXT CHECK (storage_location IN ('fridge', 'pantry', 'freezer')) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_items_user_id ON public.food_items(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_storage_location ON public.food_items(storage_location);
CREATE INDEX IF NOT EXISTS idx_food_items_expiration_date ON public.food_items(expiration_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own food items
CREATE POLICY "Users can view own food items" ON public.food_items
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own food items
CREATE POLICY "Users can insert own food items" ON public.food_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own food items
CREATE POLICY "Users can update own food items" ON public.food_items
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own food items
CREATE POLICY "Users can delete own food items" ON public.food_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
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