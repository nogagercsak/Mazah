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
        const { data, error } = await supabase
          .from('user_profiles')
          .select('completed_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        // If no profile exists or completed_at is null, user needs onboarding
        const needsOnboarding = !data || !data.completed_at;
        console.log('Onboarding check:', { 
          hasProfile: !!data, 
          completedAt: data?.completed_at,
          needsOnboarding,
          userId: user.id
        });
        
        setNeedsOnboarding(needsOnboarding);
        setHasCheckedOnboarding(true);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error, assume onboarding is needed
        setNeedsOnboarding(true);
        setHasCheckedOnboarding(true);
      }
    }

    checkOnboardingStatus();
  }, [user]);

  // Handle navigation
  useEffect(() => {
    if (!hasCheckedOnboarding) return;

    const inAuthGroup = segments[0] === 'auth';
    const isOnboarding = segments[1] === 'onboarding';
    const isSignup = segments[1] === 'signup';
    const isLogin = segments[1] === 'login';
    const inMainApp = segments[0] === '(tabs)';
    const isProfile = segments[0] === 'profile';
    
    console.log('Navigation check:', {
      user: !!user,
      inAuthGroup,
      isOnboarding,
      needsOnboarding,
      currentPath: segments.join('/'),
      isProfile
    });

    if (!user && !inAuthGroup) {
      // If not signed in and not in auth group, go to login
      router.replace('/auth/login');
    } else if (user) {
      if (needsOnboarding && !isOnboarding && !isSignup && !inMainApp && !isProfile) {
        // If needs onboarding and not in onboarding, signup, main app, or profile, go to onboarding
        router.replace('/auth/onboarding');
      } else if (!needsOnboarding && inAuthGroup && !inMainApp && !isSignup) {
        // If doesn't need onboarding and in auth group (but not signup) and not main app, go to main app
        router.replace('/');
      }
    }
  }, [user, segments, hasCheckedOnboarding, needsOnboarding]);
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
        <ActivityIndicator size="large" color={proto.accent} />
        <Text style={{ marginTop: 16, color: proto.text }}>Loading...</Text>
      </View>
    );
  }

  console.log('RootLayoutNav: Loading complete, user authenticated:', !!user);
  console.log('RootLayoutNav: Rendering stack with screens:', user ? '(tabs) and add-item' : 'auth/login and auth/signup');

  return (
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
  );
}
