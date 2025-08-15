import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // You need to add this to your .env
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Starting complete account deletion for user:', userId);

    // Step 1: Delete user data from custom tables FIRST
    // This is important because once we delete the auth user, we lose the reference
    await deleteUserData(userId);

    // Step 2: Delete the authentication user (this removes them from auth.users)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      throw deleteUserError;
    }

    console.log('Complete account deletion successful');

    return Response.json({
      success: true,
      message: 'Account completely deleted'
    });

  } catch (error) {
    console.error('Complete account deletion error:', error);
    
    return Response.json(
      { 
        error: 'Failed to delete account completely',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Function to delete all user-related data from custom tables
async function deleteUserData(userId: string) {
  try {
    console.log('Deleting user data for:', userId);

    // Delete in the correct order to respect foreign key constraints
    
    // 1. Delete meal plans (if they reference other tables)
    const { error: mealPlansError } = await supabaseAdmin
      .from('meal_plans')
      .delete()
      .eq('user_id', userId);
    
    if (mealPlansError && mealPlansError.code !== 'PGRST116') {
      console.error('Error deleting meal plans:', mealPlansError);
      throw mealPlansError;
    }

    // 2. Delete food items from inventory
    const { error: foodItemsError } = await supabaseAdmin
      .from('food_items')
      .delete()
      .eq('user_id', userId);
    
    if (foodItemsError && foodItemsError.code !== 'PGRST116') {
      console.error('Error deleting food items:', foodItemsError);
      throw foodItemsError;
    }

    // 3. Add more deletions here for other tables that reference the user
    // Example:
    /*
    const { error: recipesError } = await supabaseAdmin
      .from('recipes')
      .delete()
      .eq('user_id', userId);
    
    if (recipesError && recipesError.code !== 'PGRST116') {
      throw recipesError;
    }
    */

    console.log('User data deleted successfully');
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
}