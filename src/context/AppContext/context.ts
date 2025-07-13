import { createContext } from 'react';
import type { AppContextType } from './types';

// Initial state for the context
const AppContextInitialState = {
  currentEventId: 'default-event',
} as const;

// Create the context with a default value that matches the AppContextType
// This will be used when the context is used outside of a provider (shouldn't happen in our app)
export const AppContext = createContext<AppContextType>({
  ...AppContextInitialState,
  setCurrentEventId: () => {
    console.warn('setCurrentEventId was called without a provider');
  },
});

export { AppContextInitialState };
