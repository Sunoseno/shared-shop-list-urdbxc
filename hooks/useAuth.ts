
import { useState, useEffect } from 'react';

// Simplified auth hook that doesn't use Supabase initially
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Start with false to avoid loading states
  const [session, setSession] = useState(null);

  useEffect(() => {
    console.log('useAuth: Simplified auth - no Supabase connection');
    // For now, we'll work in offline mode
    setLoading(false);
    setUser(null);
  }, []);

  const signInAnonymously = async () => {
    console.log('useAuth: Sign in anonymously (offline mode)');
    // For offline mode, we don't actually sign in
    return { user: null };
  };

  const signInWithEmail = async (email: string) => {
    console.log('useAuth: Sign in with email (offline mode):', email);
    // For offline mode, we don't actually sign in
    return { user: null };
  };

  const signOut = async () => {
    console.log('useAuth: Sign out (offline mode)');
    setUser(null);
    setSession(null);
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
