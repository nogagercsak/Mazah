import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for food inventory
export interface FoodItem {
  id: string;
  name: string;
  quantity: string;
  expiration_date: string;
  storage_location: 'fridge' | 'pantry' | 'freezer';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryData {
  fridge: FoodItem[];
  pantry: FoodItem[];
  freezer: FoodItem[];
} 