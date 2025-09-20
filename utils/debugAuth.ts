import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugAuthStorage = async () => {
  if (!__DEV__) return;
  
  try {
    console.log('=== Auth Storage Debug ===');
    
    // Get all AsyncStorage keys
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session') ||
      key.includes('token')
    );
    
    console.log('All storage keys:', keys);
    console.log('Auth-related keys:', authKeys);
    
    // Get auth-related values
    for (const key of authKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        console.log(`${key}:`, value ? 'exists' : 'null');
        if (value && key.includes('supabase')) {
          const parsed = JSON.parse(value);
          if (parsed.access_token) {
            console.log(`${key} - has access_token, expires:`, parsed.expires_at ? new Date(parsed.expires_at * 1000).toISOString() : 'no expiry');
          }
        }
      } catch (e) {
        console.log(`${key}: error reading -`, e);
      }
    }
    
    console.log('=== End Auth Storage Debug ===');
  } catch (error) {
    console.error('Error debugging auth storage:', error);
  }
};

export const clearAuthStorage = async () => {
  if (!__DEV__) return;
  
  try {
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session')
    );
    
    console.log('Clearing auth storage keys:', authKeys);
    await AsyncStorage.multiRemove(authKeys);
    console.log('Auth storage cleared');
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
};