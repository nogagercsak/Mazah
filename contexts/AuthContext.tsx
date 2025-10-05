import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import notificationService from '@/services/notificationService';
import { debugAuthStorage } from '@/utils/debugAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setSession(null);
    } catch (error) {
      if (__DEV__) console.error('Error signing out:', error);
      throw error;
    }
  };

  // Initialize notifications when user is authenticated
  const initializeNotifications = async (user: User) => {
    try {
      // Check if user has already been prompted for notifications
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('notifications_enabled')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      if (profileError) {
        if (__DEV__) console.log('Error checking profile for notifications:', profileError);
        return;
      }

      // If user hasn't been prompted yet, initialize notifications
      if (!profile || profile.notifications_enabled === null) {
        if (__DEV__) console.log('Initializing notifications for user:', user.id);
        await notificationService.initialize();
      }
    } catch (error) {
      if (__DEV__) console.error('Error initializing notifications:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        if (__DEV__) {
          console.log('AuthContext: Getting initial session...');
          await debugAuthStorage();
        }
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (__DEV__) console.error('AuthContext: Error getting session:', error);
        } else {
          if (__DEV__) console.log('AuthContext: Initial session:', session ? `exists for user ${session.user.email}` : 'none');
          if (__DEV__ && session) {
            console.log('AuthContext: Session expires at:', new Date(session.expires_at! * 1000).toISOString());
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Initialize notifications if user is authenticated
        if (session?.user) {
          initializeNotifications(session.user);
        }
        
        setLoading(false);
      } catch (error) {
        if (__DEV__) console.error('AuthContext: Error getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (__DEV__) console.log('AuthContext: Auth state change:', event, session ? `user ${session.user.email}` : 'no user');
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Initialize notifications when user signs in
        if (session?.user) {
          initializeNotifications(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else if (event === 'USER_UPDATED') {
        // Handle user updates without clearing session
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      }
      
      // Only set loading to false if we're not in the middle of getting initial session
      if (event !== 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle app state changes to refresh session when app becomes active
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && !loading) {
        if (__DEV__) console.log('AuthContext: App became active, checking session...');
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            if (__DEV__) console.error('AuthContext: Error refreshing session on app active:', error);
            // Don't sign out on error - could be network issue
            return;
          }
          
          if (session) {
            if (__DEV__) console.log('AuthContext: Session refreshed on app active');
            setSession(session);
            setUser(session.user);
          } else {
            // Only clear if there's truly no session
            if (__DEV__) console.log('AuthContext: No session found on app active');
            setSession(null);
            setUser(null);
          }
        } catch (error) {
          if (__DEV__) console.error('AuthContext: Error checking session on app active:', error);
          // Don't clear session on catch - could be temporary error
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [loading]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

