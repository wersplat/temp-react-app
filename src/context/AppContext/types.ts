import { type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

export interface AppContextType {
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
  user: User | null;
  signOut: () => Promise<void>;
  // Add other app-wide state here in the future
}

export interface AppProviderProps {
  children: ReactNode;
}

// This will be used to type the context value
export const AppContextInitialState: Omit<AppContextType, 'setCurrentEventId' | 'signOut'> = {
  currentEventId: null,
  user: null,
};
