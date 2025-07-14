import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { playersApi, teamsApi, eventsApi, type PlayerPosition, type Event } from '../services/supabase';
import { useApp } from '../context/AppContext';

const positionOptions: PlayerPosition[] = [
  'Point Guard',
  'Shooting Guard',
  'Lock',
  'Power Forward',
  'Center',
];

const AdminPage = () => {
  const { currentEventId, setCurrentEventId } = useApp();
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition | ''>('');
  const [teamName, setTeamName] = useState('');
  const [teamLogoUrl, setTeamLogoUrl] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [numTeams, setNumTeams] = useState(12);
  const [picksPerTeam, setPicksPerTeam] = useState(15);
  const [pickTimeSeconds, setPickTimeSeconds] = useState(60);
  const [eventPrizePool, setEventPrizePool] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  // Removed unused state variables

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventId) return toast.error('No event selected');
    
    if (!playerName.trim()) {
      toast.error('Player name is required');
      return;
    }
    
    if (!playerPosition) {
      toast.error('Please select a valid position');
      return;
    }
    
    try {
      await playersApi.create(
        playerName.trim(),
        playerPosition as PlayerPosition,
        currentEventId
      );
      
      toast.success(`${playerName} added successfully`);
      
      // Reset form
      setPlayerName('');
      setPlayerPosition('');
    } catch (err) {
      console.error('Error adding player:', err);
      toast.error(`Failed to add player: ${(err as Error).message}`);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentEventId) {
      // If no event is selected, check if any events exist
      try {
        const existingEvents = await eventsApi.getAll();
        
        if (!existingEvents || existingEvents.length === 0) {
          // No events exist, prompt to create one
          toast.error('Please create an event first');
          setShowEventForm(true);
          return;
        }
        
        // Events exist but none selected, select the first one
        const firstEvent = existingEvents[0];
        setCurrentEventId(firstEvent.id);
        toast.success(`Selected event: ${firstEvent.name}`);
        return;
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to fetch events');
        return;
      }
    }
    
    if (!teamName.trim()) {
      toast.error('Team name is required');
      return;
    }
    
    try {
      await teamsApi.create(
        teamName.trim(), 
        currentEventId, 
        teamLogoUrl.trim() || null
      );
      
      toast.success(`Team "${teamName}" added successfully`);
      setTeamName('');
      setTeamLogoUrl('');
    } catch (err) {
      console.error('Error adding team:', err);
      const errorMessage = (err as Error).message;
      
      if (errorMessage.includes('Event with ID') || errorMessage.includes('inactive event')) {
        // If event is invalid or inactive, clear the current event and show event form
        setCurrentEventId(null);
        setShowEventForm(true);
      }
      
      toast.error(`Failed to add team: ${errorMessage}`);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventName.trim()) {
      toast.error('Event name is required');
      return;
    }

    if (numTeams < 1) {
      toast.error('Number of teams must be at least 1');
      return;
    }

    if (picksPerTeam < 1) {
      toast.error('Picks per team must be at least 1');
      return;
    }
    
    try {
      await eventsApi.create(
        eventName.trim(),
        eventDate || null,
        true,
        'snake',
        numTeams,
        pickTimeSeconds,
        picksPerTeam,
        eventPrizePool ? Number(eventPrizePool) : null
      );
      
      toast.success('Event created successfully');
      
      // Reset form
      setEventName('');
      setEventDate('');
      setNumTeams(12);
      setPicksPerTeam(15);
      setPickTimeSeconds(60);
      setEventPrizePool('');
    } catch (err) {
      toast.error(`Failed to create event: ${(err as Error).message}`);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const events = await eventsApi.getAll();
        setEvents(events);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to fetch events');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const shouldShowEventForm = showEventForm || (events.length === 0 && !isLoading);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        {/* Event Management */}
        {shouldShowEventForm ? (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
            <p className="text-sm text-gray-600 mb-4">
              You need to create an event before you can add teams or players.
            </p>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., 2023 Fantasy Draft"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
                    Event Date (optional)
                  </label>
                  <input
                    type="date"
                    id="eventDate"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="numTeams" className="block text-sm font-medium text-gray-700">
                    Number of Teams *
                  </label>
                  <input
                    type="number"
                    id="numTeams"
                    min="1"
                    max="32"
                    value={numTeams}
                    onChange={(e) => setNumTeams(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="picksPerTeam" className="block text-sm font-medium text-gray-700">
                    Picks per Team *
                  </label>
                  <input
                    type="number"
                    id="picksPerTeam"
                    min="1"
                    value={picksPerTeam}
                    onChange={(e) => setPicksPerTeam(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="pickTimeSeconds" className="block text-sm font-medium text-gray-700">
                    Time per Pick (seconds)
                  </label>
                  <input
                    type="number"
                    id="pickTimeSeconds"
                    min="5"
                    value={pickTimeSeconds}
                    onChange={(e) => setPickTimeSeconds(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500 sm:text-sm"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label htmlFor="prizePool" className="block text-sm font-medium text-gray-700">
                    Prize Pool (optional)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="prizePool"
                      min="0"
                      step="0.01"
                      value={eventPrizePool}
                      onChange={(e) => setEventPrizePool(e.target.value)}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                {events.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                )}
                <div className="ml-auto">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Current Event: {events.find(e => e.id === currentEventId)?.name || 'None selected'}</h2>
              <button
                onClick={() => setShowEventForm(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                New Event
              </button>
            </div>
            {events.length > 0 && (
              <div className="mt-2">
                <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Switch Event
                </label>
                <select
                  id="eventSelect"
                  value={currentEventId || ''}
                  onChange={(e) => setCurrentEventId(e.target.value || null)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} {event.startDate ? `(${new Date(event.startDate).toLocaleDateString()})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        
        {/* Player Management */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Player</h2>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
                  Player Name *
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., LeBron James"
                  required
                />
              </div>
              <div>
                <label htmlFor="playerPosition" className="block text-sm font-medium text-gray-700">
                  Position *
                </label>
                <select
                  id="playerPosition"
                  value={playerPosition}
                  onChange={(e) => setPlayerPosition(e.target.value as PlayerPosition)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select Position</option>
                  {positionOptions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Player
              </button>
            </div>
          </form>
        </div>
        
        {/* Team Management */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Team</h2>
          {events.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Please create an event first to add teams.</p>
              <button
                type="button"
                onClick={() => setShowEventForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Event
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddTeam} className="space-y-4">
              {!currentEventId && events.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Please select an event from the dropdown above to add teams.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">
                  Team Name *
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Team Awesome"
                  required
                  disabled={!currentEventId}
                />
              </div>
              <div>
                <label htmlFor="teamLogoUrl" className="block text-sm font-medium text-gray-700">
                  Logo URL (optional)
                </label>
                <input
                  type="url"
                  id="teamLogoUrl"
                  value={teamLogoUrl}
                  onChange={(e) => setTeamLogoUrl(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="https://example.com/logo.png"
                  disabled={!currentEventId}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentEventId}
                >
                  Add Team
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
