import { useState, useMemo } from 'react';
import { AppContext } from './context';
import { AppContextInitialState } from './context';
import type { AppProviderProps } from './types';

export function AppProvider({ children }: AppProviderProps) {
  const [currentEventId, setCurrentEventId] = useState<string | null>(
    AppContextInitialState.currentEventId
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      currentEventId,
      setCurrentEventId,
    }),
    [currentEventId]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
