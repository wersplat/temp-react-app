import { createContext } from 'react';
import type { AppContextType, AppProviderProps } from './types';
import { supabase } from '../../lib/supabase';

// Initial state for the context
export const AppContextInitialState: Omit<AppContextType, 'setCurrentEventId' | 'signOut'> = {
  currentEventId: '00000000-0000-0000-0000-000000000001', // Default event ID
  user: null,
} as const;

// Default implementation for context methods
const defaultSetCurrentEventId = () => {
  console.warn('setCurrentEventId was called without a provider');
};

const defaultSignOut = async () => {
  console.warn('signOut was called without a provider');
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error);
};

// Create the context with a default value that matches the AppContextType
// This will be used when the context is used outside of a provider (shouldn't happen in our app)
export const AppContext = createContext<AppContextType>({
  ...AppContextInitialState,
  setCurrentEventId: defaultSetCurrentEventId,
  signOut: defaultSignOut,
});

// Export the type for AppContext for easier consumption
export type { AppContextType, AppProviderProps };
