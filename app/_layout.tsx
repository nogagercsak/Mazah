import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '../constants/Colors';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { supabase } from '../lib/supabase';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

const proto = Colors.proto;

// Debug component
function AuthDebugInfo({ user, loading }: { user: any, loading: boolean }) {
  const segments = useSegments();
  
  
  
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: SpaceMono_400Regular,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {
        /* reloading the app might trigger some race conditions, ignore them */
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function useProtectedRoute(user: any) {
  const segments = useSegments();
  const router = useRouter();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  // Check if user needs onboarding
  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) {
        setHasCheckedOnboarding(true);
        setNeedsOnboarding(false);
        return;
      }

      try {
        console.log('Checking onboarding status for user:', user.id);
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('completed_at, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" which is expected for new users
          console.error('Error checking onboarding status:', error);
          // Assume needs onboarding if we can't check
          setNeedsOnboarding(true);
          setHasCheckedOnboarding(true);
          return;
        }

        // If no profile exists or completed_at is null, user needs onboarding
        const needsOnboarding = !data || !data.completed_at;
        console.log('Onboarding check result:', { 
          hasProfile: !!data, 
          completedAt: data?.completed_at,
          createdAt: data?.created_at,
          needsOnboarding,
          userId: user.id,
          checkTime: new Date().toISOString()
        });
        
        setNeedsOnboarding(needsOnboarding);
        setHasCheckedOnboarding(true);
      } catch (error) {
        console.error('Unexpected error checking onboarding status:', error);
        // Assume needs onboarding on unexpected errors
        setNeedsOnboarding(true);
        setHasCheckedOnboarding(true);
      }
    }

    // Reset state when user changes
    if (user) {
      setHasCheckedOnboarding(false);
      checkOnboardingStatus();
    } else {
      setHasCheckedOnboarding(true);
      setNeedsOnboarding(false);
    }
  }, [user?.id]); // FIXED: Remove lastCheckTime from dependency

  // Add a periodic re-check when on onboarding screen
  useEffect(() => {
    const isOnboarding = segments[1] === 'onboarding';
    
    if (user && isOnboarding && hasCheckedOnboarding && needsOnboarding) {
      console.log('Setting up periodic onboarding status check...');
      
      const interval = setInterval(async () => {
        console.log('Periodic check: Re-checking onboarding status...');
        
        const { data } = await supabase
          .from('user_profiles')
          .select('completed_at')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data && data.completed_at) {
          console.log('Periodic check: Onboarding completed! Updating state...');
          setNeedsOnboarding(false);
          clearInterval(interval);
        }
      }, 2000); // Check every 2 seconds
      
      return () => {
        console.log('Cleaning up periodic onboarding check...');
        clearInterval(interval);
      };
    }
  }, [user, segments, hasCheckedOnboarding, needsOnboarding]);

  // Handle navigation
  useEffect(() => {
    if (!hasCheckedOnboarding) {
      console.log('Still checking onboarding status, skipping navigation...');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const isOnboarding = segments[1] === 'onboarding';
    const isSignup = segments[1] === 'signup';
    const isLogin = segments[1] === 'login';
    const inMainApp = segments[0] === '(tabs)';
    const isProfile = segments[0] === 'profile';
    
    console.log('Navigation check:', {
      user: !!user,
      hasCheckedOnboarding,
      inAuthGroup,
      isOnboarding,
      needsOnboarding,
      currentPath: segments.join('/'),
      isProfile
    });

    if (!user) {
      // If not signed in and not in auth group, go to login
      if (!inAuthGroup) {
        console.log('No user, redirecting to login...');
        router.replace('/auth/login');
      }
    } else if (user && hasCheckedOnboarding) {
      if (needsOnboarding) {
        // If needs onboarding and not already there, go to onboarding
        if (!isOnboarding) {
          console.log('User needs onboarding, redirecting...');
          router.replace('/auth/onboarding');
        }
      } else {
        // Onboarding is complete
        if (inAuthGroup && !isSignup && !isLogin) {
          // If in auth group (but not signup/login), go to main app
          console.log('Onboarding complete, redirecting to main app...');
          router.replace('/');
        }
      }
    }
  }, [user, segments, hasCheckedOnboarding, needsOnboarding, router]);
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  
  // Use the protection hook
  useProtectedRoute(user);

  // Debug: Log authentication state
  console.log('RootLayoutNav: Loading:', loading, 'User:', user ? user.email : 'No user');

  // Show loading screen while checking authentication
  if (loading) {
    console.log('RootLayoutNav: Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: proto.background }}>
        <AuthDebugInfo user={user} loading={loading} />
        <ActivityIndicator size="large" color={proto.accent} />
        <Text style={{ marginTop: 16, color: proto.text }}>Loading...</Text>
      </View>
    );
  }

  console.log('RootLayoutNav: Loading complete, user authenticated:', !!user);
  console.log('RootLayoutNav: Rendering stack with screens:', user ? '(tabs) and add-item' : 'auth/login and auth/signup');

  return (
    <>
      <AuthDebugInfo user={user} loading={loading} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: proto.background },
          headerShown: false,
        }}
      >
        {user ? (
          // Authenticated user - show main app and onboarding
          <>
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
                header: () => null,
              }} 
            />
            <Stack.Screen name="add-item" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="auth/onboarding" options={{ headerShown: false }} />
          </>
        ) : (
          // Not authenticated - show auth screens
          <>
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
          </>
        )}
      </Stack>
    </>
  ); 
}