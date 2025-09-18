
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Alert } from 'react-native';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    console.log('useAuth: Initializing auth with Supabase');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('useAuth: Initial session check:', { session: session?.user?.email, error });
        
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (error) {
        console.error('useAuth: Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInAnonymously = async () => {
    console.log('useAuth: Signing in anonymously');
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('useAuth: Anonymous sign in error:', error);
        Alert.alert('Sign In Error', error.message);
        return { user: null, error };
      }

      console.log('useAuth: Anonymous sign in successful');
      return { user: data.user, error: null };
    } catch (error) {
      console.error('useAuth: Anonymous sign in exception:', error);
      Alert.alert('Sign In Error', 'Failed to sign in anonymously');
      return { user: null, error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log('useAuth: Signing in with email:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('useAuth: Email sign in error:', error);
        Alert.alert('Sign In Error', error.message);
        return { user: null, error };
      }

      console.log('useAuth: Email sign in successful');
      return { user: data.user, error: null };
    } catch (error) {
      console.error('useAuth: Email sign in exception:', error);
      Alert.alert('Sign In Error', 'Failed to sign in with email');
      return { user: null, error };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    console.log('useAuth: Signing up with email:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed'
        }
      });
      
      if (error) {
        console.error('useAuth: Email sign up error:', error);
        Alert.alert('Sign Up Error', error.message);
        return { user: null, error };
      }

      console.log('useAuth: Email sign up successful');
      Alert.alert(
        'Check Your Email', 
        'Please check your email and click the verification link to complete your registration.'
      );
      return { user: data.user, error: null };
    } catch (error) {
      console.error('useAuth: Email sign up exception:', error);
      Alert.alert('Sign Up Error', 'Failed to sign up with email');
      return { user: null, error };
    }
  };

  const signOut = async () => {
    console.log('useAuth: Signing out');
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('useAuth: Sign out error:', error);
        Alert.alert('Sign Out Error', error.message);
        return { error };
      }

      console.log('useAuth: Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('useAuth: Sign out exception:', error);
      Alert.alert('Sign Out Error', 'Failed to sign out');
      return { error };
    }
  };

  return {
    session,
    user,
    loading,
    signInAnonymously,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
};
