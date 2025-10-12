import { supabase } from '@/lib/supabase';

/**
 * Test utility to verify the favorite foods feature is properly set up
 */
export const testFavoriteFoodsSetup = async () => {
  try {
    console.log('🧪 Testing Favorite Foods Setup...\n');
    
    // Test 1: Check if table exists
    console.log('1️⃣ Checking if user_favorite_foods table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_favorite_foods')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table does not exist or has errors:', tableError.message);
      console.log('\n⚠️  Please run the database migration from QUICK_SETUP_FAVORITES.md\n');
      return false;
    }
    console.log('✅ Table exists!\n');
    
    // Test 2: Check authentication
    console.log('2️⃣ Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ User not authenticated:', authError?.message);
      return false;
    }
    console.log('✅ User authenticated:', user.id, '\n');
    
    // Test 3: Try to insert a test favorite
    console.log('3️⃣ Testing insert operation...');
    const testFoodName = `__TEST_${Date.now()}__`;
    const { error: insertError } = await supabase
      .from('user_favorite_foods')
      .insert({
        user_id: user.id,
        food_name: testFoodName,
        storage_location: 'pantry',
        default_quantity: '1 test',
      });
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      return false;
    }
    console.log('✅ Insert successful!\n');
    
    // Test 4: Try to read the test favorite
    console.log('4️⃣ Testing select operation...');
    const { data: selectData, error: selectError } = await supabase
      .from('user_favorite_foods')
      .select('*')
      .eq('user_id', user.id)
      .eq('food_name', testFoodName)
      .single();
    
    if (selectError) {
      console.error('❌ Select failed:', selectError.message);
      return false;
    }
    console.log('✅ Select successful! Data:', selectData, '\n');
    
    // Test 5: Try to delete the test favorite
    console.log('5️⃣ Testing delete operation...');
    const { error: deleteError } = await supabase
      .from('user_favorite_foods')
      .delete()
      .eq('user_id', user.id)
      .eq('food_name', testFoodName);
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError.message);
      return false;
    }
    console.log('✅ Delete successful!\n');
    
    console.log('🎉 All tests passed! Favorite Foods feature is properly set up.\n');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    return false;
  }
};

/**
 * Quick test to check if the table exists
 */
export const checkTableExists = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_favorite_foods')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Table check failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Table check error:', error);
    return false;
  }
};
