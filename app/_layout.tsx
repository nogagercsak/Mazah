import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

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
    if (error) console.log('Font loading error:', error);
  }, [error]);

  const onLayoutRootView = useCallback(async () => {
    if (loaded) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </View>
  );
}

function useProtectedRoute(user: any) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === 'auth';
    
    if (!user && !inAuthGroup) {
      // If the user is not signed in and the initial segment is not in the auth group,
      // redirect to the login page
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // If the user is signed in and the initial segment is in the auth group,
      // redirect to the home page
      router.replace('/');
    }
  }, [user, segments]);
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
        // Authenticated user - show main app
        <>
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
              header: () => null,
            }} 
          />
          <Stack.Screen name="add-item" options={{ headerShown: false }} />
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
