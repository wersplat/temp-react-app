import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'upa-draft-app/1.0.0',
      'apikey': supabaseAnonKey,
    },
  },
});

// Add a response interceptor to handle auth state changes
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    // Clear any sensitive data from localStorage
    localStorage.removeItem('supabase.auth.token');
  }
});

// Function to get the current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('Error getting session:', error.message);
    return null;
  }
  return session;
};

// Function to sign in if needed
export const signInIfNeeded = async () => {
  // Only attempt to sign in if there's no active session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('No active session, but anonymous sign-ins are disabled');
    // Return null since we're not signing in anonymously
    return null;
  }
  return session;
};
