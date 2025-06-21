import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for food inventory
export type FoodItem = {
  id: string;
  name: string;
  quantity: string;
  expiration_date: string;
  storage_location: 'fridge' | 'pantry' | 'freezer';
  user_id: string;
  daysLeft?: number; // Added for UI display
};

export interface InventoryData {
  fridge: FoodItem[];
  pantry: FoodItem[];
  freezer: FoodItem[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  name: string;
  description: string | null;
}

export interface MealPlan {
  id: string;
  created_at: string;
  updated_at: string;
  date: string;
  meal_id: string;
  user_id: string;
  meal_type: MealType;
  meal?: Meal; // For joined queries
}

export interface MealIngredient {
  id: string;
  created_at: string;
  updated_at: string;
  meal_id: string;
  name: string;
  quantity: string;
  category: string;
}

export interface DayPlan {
  date: string;
  meals: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snack: Meal[];
  };
  efficiency: {
    reusedIngredients: number;
    totalIngredients: number;
  };
} 