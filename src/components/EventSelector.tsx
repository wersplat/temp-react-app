import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { eventsApi } from '../services/events';
import { useQuery } from '@tanstack/react-query';
import { ChevronDownIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';

export default function EventSelector() {
  const { currentEventId, setCurrentEventId } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch all events with error handling
  const { 
    data: events = [], 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getAll(),
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.event-selector-container')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set the first event as default if none is selected
  useEffect(() => {
    if (!currentEventId && events.length > 0) {
      setCurrentEventId(events[0].id);
    }
  }, [currentEventId, events, setCurrentEventId]);

  const currentEvent = events.find(event => event.id === currentEventId) || events[0];
  
  if (isError) {
    return (
      <div className="relative event-selector-container">
        <button
          type="button"
          className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md shadow-sm hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={() => refetch()}
          title={error instanceof Error ? error.message : 'Error loading events'}
        >
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          Error loading events
          <ArrowPathIcon className="w-4 h-4 ml-2" />
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative event-selector-container">
        <button
          type="button"
          className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm cursor-not-allowed"
          disabled
        >
          <span className="flex items-center">
            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
            Loading events...
          </span>
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="relative event-selector-container">
        <button
          type="button"
          className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-md shadow-sm cursor-not-allowed"
          disabled
          title="No events available"
        >
          No events available
        </button>
      </div>
    );
  }
  
  return (
    <div className="relative event-selector-container">
      <button
        type="button"
        className="inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 min-w-[200px]"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{currentEvent?.name || 'Select Event'}</span>
        <ChevronDownIcon className={`w-5 h-5 ml-2 -mr-1 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 z-10 w-56 mt-1 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="listbox"
          aria-labelledby="event-selector-button"
        >
          <div className="py-1 max-h-60 overflow-auto" role="list">
            {events.map((event) => (
              <button
                key={event.id}
                className={`block w-full px-4 py-2 text-sm text-left ${
                  currentEventId === event.id
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentEventId(event.id);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={currentEventId === event.id}
              >
                {event.name}
                {event.isActive && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
