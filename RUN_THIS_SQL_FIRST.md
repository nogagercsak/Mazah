# Database Setup for Favorites Feature

## You Need to Run This SQL in Supabase

The error "failed to update favorite status" means the database table doesn't exist yet.

### Steps:

1. **Go to Supabase Dashboard**
   - Log into your Supabase project at https://supabase.com

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste This SQL:**

```sql
-- =============================================
-- Create Favorites Table
-- =============================================

-- Create the table
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorite_foods_user_id 
  ON public.user_favorite_foods(user_id);

CREATE INDEX IF NOT EXISTS idx_user_favorite_foods_food_name 
  ON public.user_favorite_foods(food_name);

-- Enable Row Level Security
ALTER TABLE public.user_favorite_foods ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (so users can only see their own favorites)
CREATE POLICY "Users can view own favorite foods" 
  ON public.user_favorite_foods
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite foods" 
  ON public.user_favorite_foods
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite foods" 
  ON public.user_favorite_foods
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite foods" 
  ON public.user_favorite_foods
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create updated_at trigger (if the function exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at'
  ) THEN
    CREATE TRIGGER handle_user_favorite_foods_updated_at
      BEFORE UPDATE ON public.user_favorite_foods
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;
```

4. **Click "Run" or press Ctrl+Enter**

5. **Verify Success**
   - You should see "Success. No rows returned"
   - Go to "Table Editor" in left sidebar
   - You should see `user_favorite_foods` table listed

---

## Test It Worked

After running the SQL, go back to your app:

1. **Type a food name** (e.g., "Milk")
2. **Click "Add to Favorites"**
3. **You should see:**
   - Alert: "⭐ Added to Favorites"
   - Button changes to green "Favorited"
   - No error messages!

---

## Verify in Database

1. Go to Supabase → Table Editor
2. Click on `user_favorite_foods`
3. You should see your favorited item with:
   - `user_id`: Your user ID
   - `food_name`: "Milk"
   - `storage_location`: Selected storage
   - `default_quantity`: If you entered one

---

## About That iOS Error

The error message you saw:
```
[RTIInputSystemClient remoteTextInputSessionWithID:performInputOperation:]...
```

This is a **known iOS Simulator bug** from Apple, not our code. It happens when the keyboard appears and doesn't affect functionality. You can safely ignore it.

**To reduce these warnings:**
- Use a real device instead of simulator (they won't appear)
- Or just ignore them - they're harmless

---

## If Still Getting Errors

### Error: "new row violates row-level security policy"

**Cause:** You're not logged in or RLS policies failed

**Fix:**
1. Make sure you're logged into the app
2. Check the RLS policies were created (see SQL above)
3. Try logging out and back in

### Error: "duplicate key value violates unique constraint"

**Cause:** Item already favorited

**Fix:** This is actually correct! Just unfavorite it first (click green "Favorited" button), then favorite again.

### Error: "permission denied for table user_favorite_foods"

**Cause:** RLS policies not set up

**Fix:** Rerun the SQL above, especially the POLICY sections

---

## Quick Test Query

To verify everything is set up, run this in SQL Editor:

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_favorite_foods'
) as table_exists;

-- Check policies exist
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'user_favorite_foods';

-- Should return 4 policies
```

Expected results:
- `table_exists`: true
- `policy_count`: 4

---

Once you run the SQL migration, the feature should work perfectly! 🎉
