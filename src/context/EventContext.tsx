import { createContext, useContext, useState, type ReactNode } from 'react';

interface EventContextType {
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider = ({ children }: EventProviderProps) => {
  // In a real app, this would come from user selection or URL
  const [currentEventId, setCurrentEventId] = useState<string | null>('default-event');

  return (
    <EventContext.Provider value={{ currentEventId, setCurrentEventId }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export default EventContext;
