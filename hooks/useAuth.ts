
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Session, User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Initializing auth');
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('useAuth: Auth timeout, setting loading to false');
      setLoading(false);
    }, 3000); // 3 second timeout

    // Get initial session
    const initAuth = async () => {
      try {
        console.log('useAuth: Getting initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('useAuth: Error getting session:', error);
        } else {
          console.log('useAuth: Initial session:', session?.user?.email || 'no session');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('useAuth: Failed to get initial session:', error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('useAuth: Auth state changed:', _event, session?.user?.email || 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signInAnonymously = async () => {
    try {
      console.log('useAuth: Signing in anonymously');
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Error signing in anonymously:', error);
        throw error;
      }
      console.log('Signed in anonymously:', data.user?.email || 'anonymous');
      return data;
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string) => {
    try {
      console.log('useAuth: Signing in with email:', email);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) {
        console.error('Error signing in with email:', error);
        throw error;
      }
      console.log('Sign in email sent:', data);
      return data;
    } catch (error) {
      console.error('Email sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('useAuth: Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return {
    session,
    user,
    loading,
    signInAnonymously,
    signInWithEmail,
    signOut,
  };
};
