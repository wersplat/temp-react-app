import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { AppContext } from './context';
import { AppContextInitialState } from './context';
import type { AppProviderProps } from './types';

// Key for localStorage
const STORAGE_KEY = 'draftApp_currentEventId';

export function AppProvider({ children }: AppProviderProps) {
  const [currentEventId, setCurrentEventIdState] = useState<string | null>(
    () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved || AppContextInitialState.currentEventId;
      }
      return AppContextInitialState.currentEventId;
    }
  );
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check active sessions and set the user
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // Listen for changes in auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user ?? null);
          }
        );

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Update localStorage when currentEventId changes
  useEffect(() => {
    if (typeof window !== 'undefined' && currentEventId) {
      localStorage.setItem(STORAGE_KEY, currentEventId);
    }
  }, [currentEventId]);

  const setCurrentEventId = useCallback((id: string | null) => {
    setCurrentEventIdState(id);
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      currentEventId,
      setCurrentEventId,
      user,
      signOut,
      loading,
    }),
    [currentEventId, setCurrentEventId, user, signOut, loading]
  );

  // Don't render children until auth state is initialized
  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
