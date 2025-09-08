
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqikevhtlflaufuvaevz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaWtldmh0bGZsYXVmdXZhZXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMjE3MjUsImV4cCI6MjA3Mjg5NzcyNX0.nFM6iVFZrH85uMEgU8GUCqEI8xA4X6ezRekvVe-QTrk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      shopping_lists: {
        Row: {
          id: string;
          name: string;
          owner: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      shopping_items: {
        Row: {
          id: string;
          list_id: string;
          name: string;
          description: string;
          done: boolean;
          repeating: 'none' | 'daily' | 'weekly' | 'monthly';
          order_index: number;
          created_at: string;
          done_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          name: string;
          description?: string;
          done?: boolean;
          repeating?: 'none' | 'daily' | 'weekly' | 'monthly';
          order_index: number;
          created_at?: string;
          done_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          name?: string;
          description?: string;
          done?: boolean;
          repeating?: 'none' | 'daily' | 'weekly' | 'monthly';
          order_index?: number;
          created_at?: string;
          done_at?: string | null;
          updated_at?: string;
        };
      };
      list_members: {
        Row: {
          id: string;
          list_id: string;
          email: string;
          role: 'owner' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          email: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          email?: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          list_id: string;
          email: string;
          token: string;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          email: string;
          token: string;
          expires_at: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          email?: string;
          token?: string;
          expires_at?: string;
          used?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
