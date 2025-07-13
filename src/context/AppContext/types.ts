import { type ReactNode } from 'react';

export interface AppContextType {
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
  // Add other app-wide state here in the future
}

export interface AppProviderProps {
  children: ReactNode;
}

// This will be used to type the context value
export const AppContextInitialState: Omit<AppContextType, 'setCurrentEventId'> = {
  currentEventId: 'default-event',
};
