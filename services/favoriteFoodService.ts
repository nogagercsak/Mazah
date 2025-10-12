import { supabase, FavoriteFood } from '@/lib/supabase';

export interface AddFavoriteParams {
  userId: string;
  foodName: string;
  storageLocation?: 'fridge' | 'pantry' | 'freezer';
  defaultQuantity?: string;
}

/**
 * Get all favorite foods for a user
 */
export const getFavoriteFoods = async (userId: string): Promise<FavoriteFood[]> => {
  try {
    const { data, error } = await supabase
      .from('user_favorite_foods')
      .select('*')
      .eq('user_id', userId)
      .order('food_name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    if (__DEV__) console.error('Error fetching favorite foods:', error);
    return [];
  }
};

/**
 * Add a food to favorites
 */
export const addFavoriteFood = async (params: AddFavoriteParams): Promise<boolean> => {
  try {
    if (__DEV__) console.log('📥 Attempting to insert favorite:', params);
    
    const { data, error } = await supabase
      .from('user_favorite_foods')
      .insert({
        user_id: params.userId,
        food_name: params.foodName,
        storage_location: params.storageLocation || null,
        default_quantity: params.defaultQuantity || null,
      })
      .select();

    if (error) {
      if (__DEV__) {
        console.error('❌ Database error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
      }
      
      // If it's a unique constraint error, it's already favorited
      if (error.code === '23505') {
        if (__DEV__) console.log('ℹ️  Food already in favorites');
        return true;
      }
      
      // If table doesn't exist
      if (error.code === '42P01') {
        if (__DEV__) console.error('❌ TABLE DOES NOT EXIST! Run the migration from RUN_THIS_SQL_FIRST.md');
        return false;
      }
      
      throw error;
    }

    if (__DEV__) console.log('✅ Successfully added to favorites:', data);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error adding favorite food:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
    }
    return false;
  }
};

/**
 * Remove a food from favorites
 */
export const removeFavoriteFood = async (userId: string, foodName: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_favorite_foods')
      .delete()
      .eq('user_id', userId)
      .eq('food_name', foodName);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    if (__DEV__) console.error('Error removing favorite food:', error);
    return false;
  }
};

/**
 * Check if a food is favorited
 */
export const isFoodFavorited = async (userId: string, foodName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_favorite_foods')
      .select('id')
      .eq('user_id', userId)
      .eq('food_name', foodName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error;
    }

    return !!data;
  } catch (error) {
    if (__DEV__) console.error('Error checking if food is favorited:', error);
    return false;
  }
};

/**
 * Toggle favorite status for a food
 */
export const toggleFavoriteFood = async (params: AddFavoriteParams): Promise<boolean> => {
  try {
    if (__DEV__) console.log('toggleFavoriteFood called with:', params);
    
    const isFavorited = await isFoodFavorited(params.userId, params.foodName);
    if (__DEV__) console.log('Current favorite status:', isFavorited);
    
    if (isFavorited) {
      if (__DEV__) console.log('Removing from favorites...');
      const result = await removeFavoriteFood(params.userId, params.foodName);
      if (__DEV__) console.log('Remove result:', result);
      return result;
    } else {
      if (__DEV__) console.log('Adding to favorites...');
      const result = await addFavoriteFood(params);
      if (__DEV__) console.log('Add result:', result);
      return result;
    }
  } catch (error) {
    if (__DEV__) console.error('Error toggling favorite food:', error);
    return false;
  }
};

/**
 * Update favorite food details (storage location or default quantity)
 */
export const updateFavoriteFood = async (
  userId: string,
  foodName: string,
  updates: { storageLocation?: 'fridge' | 'pantry' | 'freezer'; defaultQuantity?: string }
): Promise<boolean> => {
  try {
    const updateData: any = {};
    if (updates.storageLocation !== undefined) {
      updateData.storage_location = updates.storageLocation;
    }
    if (updates.defaultQuantity !== undefined) {
      updateData.default_quantity = updates.defaultQuantity;
    }

    const { error } = await supabase
      .from('user_favorite_foods')
      .update(updateData)
      .eq('user_id', userId)
      .eq('food_name', foodName);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    if (__DEV__) console.error('Error updating favorite food:', error);
    return false;
  }
};

export default {
  getFavoriteFoods,
  addFavoriteFood,
  removeFavoriteFood,
  isFoodFavorited,
  toggleFavoriteFood,
  updateFavoriteFood,
};
