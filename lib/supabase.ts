import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (__DEV__) console.warn('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
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

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  co2_per_kg: number;
  water_per_kg: number;
  standard_unit: string;
  conversion_to_kg: number;
}

export interface MealIngredient {
  id: string;
  created_at: string;
  updated_at: string;
  meal_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  quantity: number;
  unit: string;
}

export interface DayPlan {
  date: string;
  meals: {
    breakfast: (Meal & { mealPlanId: string })[];
    lunch: (Meal & { mealPlanId: string })[];
    dinner: (Meal & { mealPlanId: string })[];
    snack: (Meal & { mealPlanId: string })[];
  };
  efficiency: {
    reusedIngredients: number;
    totalIngredients: number;
    wasteReduction: {
      reusedPercentage: number;
      potentialSavings: number;
      suggestedPairings: string[];
      environmentalImpact: {
        co2_saved: number;
        water_saved: number;
        total_co2: number;
        total_water: number;
      };
    };
  };
} 