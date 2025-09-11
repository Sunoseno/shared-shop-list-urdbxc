import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://rqikevhtlflaufuvaevz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaWtldmh0bGZsYXVmdXZhZXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMjE3MjUsImV4cCI6MjA3Mjg5NzcyNX0.nFM6iVFZrH85uMEgU8GUCqEI8xA4X6ezRekvVe-QTrk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
