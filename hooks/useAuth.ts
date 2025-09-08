
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Session, User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAnonymously = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Error signing in anonymously:', error);
        throw error;
      }
      console.log('Signed in anonymously:', data);
      return data;
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string) => {
    try {
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
