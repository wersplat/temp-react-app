import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: {
      'X-Client-Info': 'upa-draft-app/1.0.0',
    },
  },
});

// Add a response interceptor to handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear any sensitive data from localStorage
    localStorage.removeItem('supabase.auth.token');
  }
  
  // Log auth state changes for debugging
  console.log('Auth state changed:', { event, session: session ? 'Session exists' : 'No session' });
});
