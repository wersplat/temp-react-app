import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { PlayerPosition, Event, Team, Player, DraftPick, DraftStatus } from '../types';

// API client interfaces
interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// Mock API clients with proper types
const eventsApi = {
  create: async (data: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Event>> => {
    const now = new Date().toISOString();
    return {
      data: {
        ...data,
        id: `event-${Date.now()}`,
        created_at: now,
        updated_at: now,
        num_teams: data.num_teams || 8,
        picks_per_team: data.picks_per_team || 5,
        pick_time_seconds: data.pick_time_seconds || 60,
        draft_type: data.draft_type || 'snake',
        created_by: 'admin',
        is_active: true,
        prize_pool: '0',
        date: data.date || new Date().toISOString()
      } as Event,
      error: null
    };
  },
  getAll: async (): Promise<ApiResponse<Event[]>> => {
    return { data: [], error: null };
  },
  getById: async (id: string): Promise<ApiResponse<Event>> => {
    return { data: null, error: null };
  }
};

const teamsApi = {
  create: async (name: string, eventId: string, logoUrl?: string): Promise<ApiResponse<Team>> => {
    return {
      data: {
        id: `team-${Date.now()}`,
        name,
        event_id: eventId,
        logo_url: logoUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Team,
      error: null
    };
  },
  getByEvent: async (eventId: string): Promise<ApiResponse<Team[]>> => {
    return { data: [], error: null };
  }
};

const playersApi = {
  create: async (data: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Player>> => {
    return {
      data: {
        ...data,
        id: `player-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Player,
      error: null
    };
  },
  getByEvent: async (eventId: string): Promise<ApiResponse<Player[]>> => {
    return { data: [], error: null };
  }
};

const draftApi = {
  startDraft: async (eventId: string): Promise<ApiResponse<{ success: boolean }>> => {
    return { data: { success: true }, error: null };
  },
  pauseDraft: async (eventId: string): Promise<ApiResponse<{ isPaused: boolean }>> => {
    return { data: { isPaused: true }, error: null };
  },
  resumeDraft: async (eventId: string): Promise<ApiResponse<{ isPaused: boolean }>> => {
    return { data: { isPaused: false }, error: null };
  },
  endDraft: async (eventId: string): Promise<ApiResponse<{ success: boolean }>> => {
    return { data: { success: true }, error: null };
  },
  getDraftStatus: async (eventId: string): Promise<ApiResponse<DraftStatus>> => {
    return { 
      data: { 
        status: 'not_started',
        currentPick: 1,
        totalPicks: 10,
        isPaused: false,
        isComplete: false
      } as DraftStatus, 
      error: null 
    };
  },
  getDraftPicks: async (eventId: string): Promise<ApiResponse<DraftPick[]>> => {
    return { data: [], error: null };
  }
};

// Mock API clients with proper types
const eventsApi = {
  getAll: (): Promise<{ data: Event[]; error: any }> => Promise.resolve({ data: [], error: null }),
  create: (data: Omit<Event, 'id' | 'created_at' | 'updated_at'> & { prizePool: string | null }) => {
    const now = new Date().toISOString();
    return Promise.resolve({ 
      data: { 
        id: '1', 
        name: data.name, 
        date: data.date, 
        num_teams: data.num_teams,
        picks_per_team: data.picks_per_team,
        pick_time_seconds: data.pick_time_seconds,
        prize_pool: data.prize_pool || '0',
        is_active: true,
        created_at: now,
        updated_at: now,
      } as Event, 
      error: null
    });
  },
  getAll: async (): Promise<{ data: Event[]; error: any }> => {
    // Mock implementation
    return {
      data: [],
      error: null
    };
  }
};

const playersApi = {
  create: async (player: Omit<Player, 'id' | 'created_at' | 'updated_at'>) => {
    // Mock implementation
    return { 
      data: { 
        ...player, 
        id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, 
      error: null 
    };
  },
  getByEvent: async (eventId: string): Promise<{ data: Player[]; error: any }> => {
    // Mock implementation
    return { data: [], error: null };
  }
};

const teamsApi = {
  create: async (name: string, eventId: string, logoUrl?: string) => {
    // Mock implementation
    return { 
      data: { 
        id: '1', 
        name, 
        event_id: eventId, 
        logo_url: logoUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, 
      error: null 
    };
  },
  getByEvent: async (eventId: string): Promise<{ data: Team[]; error: any }> => {
    // Mock implementation
    return { data: [], error: null };
  }
};

const draftApi = {
  startDraft: async (eventId: string) => {
    // Mock implementation
    return { 
      data: { 
        currentPick: 1,
        isPaused: false,
        isComplete: false,
        picks: []
      }, 
      error: null 
    };
  },
  pauseDraft: async (eventId: string) => {
    // Mock implementation
    return { data: { isPaused: true }, error: null };
  },
  resumeDraft: async (eventId: string) => {
    // Mock implementation
    return { data: { isPaused: false }, error: null };
  },
  endDraft: async (eventId: string) => {
    // Mock implementation
    return { data: { isComplete: true }, error: null };
  },
  getPicks: async (eventId: string): Promise<{ data: DraftPick[]; error: any }> => {
    // Mock implementation
    return { data: [], error: null };
  }
};

// Mock DraftPicksTable component
const DraftPicksTable = ({ picks, isLoading }: { picks: any[], isLoading: boolean }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pick</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {isLoading ? (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
              Loading picks...
            </td>
          </tr>
        ) : picks.length > 0 ? (
          picks.map((pick, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pick.pickNumber}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pick.teamName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pick.playerName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pick.position}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
              No picks made yet
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// FileUpload component for handling file uploads
interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  className?: string;
  buttonText?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  accept = 'image/*', 
  className = '',
  buttonText = 'Upload File'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
    // Reset the input to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
};

// Types for form states
interface TeamFormData {
  name: string;
  logo_url: string | null;
  logoFile: File | null;
  event_id: string;
}

interface PlayerFormData {
  name: string;
  position: PlayerPosition;
  team_id: string;
  event_id: string;
}

interface EventFormData {
  name: string;
  date: string;
  prizePool: string;
  isActive: boolean;
  num_teams: number;
  picks_per_team: number;
  pick_time_seconds: number;
  draft_type: string;
}

// Main component state
interface FormState {
  team: TeamFormData;
  player: PlayerFormData;
  event: EventFormData;
}

// Type for the form state
interface TeamFormData {
  name: string;
  logo_url: string | null;
  logoFile: File | null;
  event_id: string;
}

interface PlayerFormData {
  name: string;
  position: PlayerPosition;
  team_id: string | null;
  event_id: string;
}

interface EventFormData {
  name: string;
  date: string;
  prizePool: string;
  isActive: boolean;
  num_teams: number;
  picks_per_team: number;
  pick_time_seconds: number;
  draft_type: string;
}

interface FormState {
  event: EventFormData;
  team: TeamFormData;
  player: PlayerFormData;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId: currentEventId } = useParams<{ eventId: string }>();
  
  // State for UI
  const [activeTab, setActiveTab] = useState<string>('events');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [showTeamForm, setShowTeamForm] = useState<boolean>(false);
  const [showPlayerForm, setShowPlayerForm] = useState<boolean>(false);
  
  // Data state
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [draftStatus, setDraftStatus] = useState<DraftStatus | null>(null);
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    event: {
      name: '',
      date: new Date().toISOString().split('T')[0],
      prizePool: '0',
      isActive: true,
      num_teams: 8,
      picks_per_team: 5,
      pick_time_seconds: 60,
      draft_type: 'snake'
    },
    team: {
      name: '',
      logo_url: null,
      logoFile: null,
      event_id: currentEventId || ''
    },
    player: {
      name: '',
      position: 'Point Guard',
      team_id: null,
      event_id: currentEventId || ''
    }
  });
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);
  
  // Set current event ID from URL params
  const setCurrentEventId = (id: string) => {
    navigate(`/admin/events/${id}`);
  };
  const navigate = useNavigate();
  const { currentEventId, setCurrentEventId } = useApp();
  
  // Position options for player form
  const positionOptions: PlayerPosition[] = [
    'Point Guard',
    'Shooting Guard',
    'Small Forward',
    'Power Forward',
    'Center'
  ];
  
  // Draft state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>({
    currentPick: 0,
    isPaused: false,
    isComplete: false,
    totalPicks: 0
  });
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  
  const isPaused = draftStatus?.isPaused ?? false;

  // Form state
  const [formState, setFormState] = useState<FormState>({
    team: {
      name: '',
      logo_url: null,
      logoFile: null,
      event_id: ''
    },
    player: {
      name: '',
      position: 'Point Guard',
      team_id: '',
      event_id: ''
    },
    event: {
      name: '',
      date: new Date().toISOString().split('T')[0],
      prizePool: '0',
      isActive: true
    }
  });

  const pastPicks: DraftPick[] = []; // Would be populated with completed picks
  const currentEvent = null; // Would be set from current event data

  // Form update handlers
  const updateTeamForm = useCallback((data: Partial<TeamFormData>) => {
    setFormState(prev => ({ ...prev, team: { ...prev.team, ...data } }));
  }, []);

  // Event handlers
  const handleEventChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentEventId(e.target.value);
  }, []);

  const handleLogoChange = useCallback((file: File | null) => {
    if (!file) {
      setFormState(prev => ({
        ...prev,
        team: {
          ...prev.team,
          logo_url: null,
          logoFile: null
        }
      }));
      return;
    }
    
    try {
      const fileUrl = URL.createObjectURL(file);
      setFormState(prev => ({
        ...prev,
        team: {
          ...prev.team,
          logo_url: fileUrl,
          logoFile: file
        }
      }));
    } catch (error) {
      console.error('Error handling logo upload:', error);
      toast.error('Failed to process logo');
      setFormState(prev => ({
        ...prev,
        team: {
          ...prev.team,
          logo_url: null,
          logoFile: null
        }
      }));
    }
  }, []);

  // Handle form submissions
  const handleCreateEvent = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.event.name || !formState.event.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreatingEvent(true);
      const response = await eventsApi.create({
        name: formState.event.name,
        date: formState.event.date,
        prize_pool: formState.event.prizePool,
        is_active: true
      });

      if (response.error) {
        throw response.error;
      }

      if (response.data) {
        toast.success('Event created successfully');
        setShowEventForm(false);
        setFormState(prev => ({
          ...prev,
          event: {
            name: '',
            date: new Date().toISOString().split('T')[0],
            prizePool: '0',
            isActive: true
          }
        }));
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setIsCreatingEvent(false);
    }
  }, [formState.event]);

  const handleCreateTeam = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.team.name || !currentEventId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsUploading(true);
      // In a real app, you would upload the file to a storage service here
      // For now, we'll just use the local URL
      const logoUrl = formState.team.logo_url;
      
      const response = await teamsApi.create(
        formState.team.name,
        currentEventId,
        logoUrl || undefined
      );

      if (response.error) {
        throw response.error;
      }

      if (response.data) {
        toast.success('Team created successfully');
        setShowTeamForm(false);
        setFormState(prev => ({
          ...prev,
          team: {
            name: '',
            logo_url: null,
            logoFile: null,
            event_id: ''
          }
        }));
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setIsUploading(false);
    }
  }, [formState.team, currentEventId]);

  const handleCreatePlayer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.player.name || !formState.player.position || !currentEventId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await playersApi.create({
        name: formState.player.name,
        position: formState.player.position,
        team_id: formState.player.team_id || null,
        event_id: currentEventId
      });

      if (response.error) {
        throw response.error;
      }

      if (response.data) {
        toast.success('Player created successfully');
        setShowPlayerForm(false);
        setFormState(prev => ({
          ...prev,
          player: {
            name: '',
            position: 'Point Guard',
            team_id: '',
            event_id: ''
          }
        }));
      }
    } catch (error) {
      console.error('Error creating player:', error);
      toast.error('Failed to create player');
    }
  }, [formState.player, currentEventId]);

  const handleStartDraft = useCallback(async () => {
    if (!currentEventId) {
      toast.error('Please select an event first');
      return;
    }

    try {
      const response = await draftApi.startDraft(currentEventId);
      if (response.error) {
        throw response.error;
      }
      toast.success('Draft started successfully');
    } catch (error) {
      console.error('Error starting draft:', error);
      toast.error('Failed to start draft');
    }
  }, [currentEventId]);

  const togglePauseDraft = useCallback(async () => {
    if (!currentEventId) {
      toast.error('Please select an event first');
      return;
    }

    try {
      const response = await (draftPicks.some(pick => pick.is_paused) 
        ? draftApi.resumeDraft(currentEventId)
        : draftApi.pauseDraft(currentEventId));
      
      if (response.error) {
        throw response.error;
      }
      
      toast.success(`Draft ${response.data?.isPaused ? 'paused' : 'resumed'} successfully`);
    } catch (error) {
      console.error('Error toggling draft pause:', error);
      toast.error('Failed to update draft status');
    }
  }, [currentEventId, draftPicks]);

  const handleEndDraft = useCallback(async () => {
    if (!currentEventId) {
      toast.error('Please select an event first');
      return;
    }

    if (!window.confirm('Are you sure you want to end the draft? This cannot be undone.')) {
      return;
    }

    try {
      const response = await draftApi.endDraft(currentEventId);
      if (response.error) {
        throw response.error;
      }
      toast.success('Draft ended successfully');
    } catch (error) {
      console.error('Error ending draft:', error);
      toast.error('Failed to end draft');
    }
  }, [currentEventId]);

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await eventsApi.getAll();
        
        if (response.error) {
          throw response.error;
        }
        
        if (response.data) {
          setEvents(response.data);
          setIsLoading(false);
          
          // Set first event as current if none selected
          if (response.data.length > 0 && !currentEventId) {
            setCurrentEventId(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [currentEventId, setCurrentEventId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no events exist, show the event creation form
  if (events.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Create Your First Event</h2>
        <p className="mb-6 text-gray-600">
          You don't have any events yet. Create your first event to get started.
        </p>
        
        {showEventForm ? (
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
                Event Name *
              </label>
              <input
                type="text"
                id="eventName"
                value={eventForm.name}
                onChange={(e) => updateEventForm({ name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., 2023 Fantasy Draft"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="numTeams" className="block text-sm font-medium text-gray-700">
                  Number of Teams
                </label>
                <input
                  type="number"
                  id="numTeams"
                  min="1"
                  max="30"
                  value={eventForm.numTeams}
                  onChange={(e) => updateEventForm({ numTeams: parseInt(e.target.value, 10) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="picksPerTeam" className="block text-sm font-medium text-gray-700">
                  Picks per Team
                </label>
                <input
                  type="number"
                  id="picksPerTeam"
                  min="1"
                  max="20"
                  value={eventForm.picksPerTeam}
                  onChange={(e) => updateEventForm({ picksPerTeam: parseInt(e.target.value, 10) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
                Event Date (optional)
              </label>
              <input
                type="datetime-local"
                id="eventDate"
                value={eventForm.date}
                onChange={(e) => updateEventForm({ date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingEvent}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingEvent ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setShowEventForm(true)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Your First Event
            </button>
          </div>
        )}
      </div>
    );
  }

  const tabs = [
    {
      id: 'events',
      label: 'Events',
      content: (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Events</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Event
              </label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={currentEventId || ''}
                onChange={handleEventChange}
              >
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {new Date(event.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowEventForm(true)}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Event
              </button>
            </div>

            {showEventForm && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium mb-3">
                  {isCreatingEvent ? 'Create New Event' : 'Update Event'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Event Name</label>
                    <input
                      type="text"
                      value={eventForm.name}
                      onChange={(e) => updateEventForm({ name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Event name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => updateEventForm({ date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Number of Teams</label>
                      <input
                        type="number"
                        min="1"
                        value={eventForm.numTeams}
                        onChange={(e) => updateEventForm({ numTeams: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Picks per Team</label>
                      <input
                        type="number"
                        min="1"
                        value={eventForm.picksPerTeam}
                        onChange={(e) => updateEventForm({ picksPerTeam: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateEvent}
                      disabled={!eventForm.name || !eventForm.date}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingEvent ? 'Create Event' : 'Update Event'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'teams',
      label: 'Teams',
      content: (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Manage Teams</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Team Name</label>
              <input
                type="text"
                value={teamForm.name}
                onChange={(e) => updateTeamForm({ name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter team name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Team Logo</label>
              <FileUpload
                onFileSelect={(file) => updateTeamForm({ logoFile: file })}
                accept="image/*"
                className="mt-1"
              />
              {teamForm.logoUrl && !teamForm.logoFile && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Current logo:</p>
                  <img
                    src={teamForm.logoUrl}
                    alt="Team logo preview"
                    className="h-16 w-16 object-contain mt-1"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleCreateTeam}
              disabled={!teamForm.name || isUploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Add Team'}
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'players',
      label: 'Players',
      content: (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Players</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Player Name</label>
              <input
                type="text"
                value={playerForm.name}
                onChange={(e) => updatePlayerForm({ name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter player name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <select
                value={playerForm.position}
                onChange={(e) => updatePlayerForm({ position: e.target.value as PlayerPosition })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Select position</option>
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleCreatePlayer}
              disabled={!playerForm.name || !playerForm.position}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Player
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'draft',
      label: 'Draft Control',
      content: (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Draft Controls</h2>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleStart}
                className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isPaused ? (currentPick === 1 ? 'Start Draft' : 'Resume Draft') : 'Pause Draft'}
              </button>
              <button
                type="button"
                onClick={handleEnd}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Picks</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pick #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingPicks.map((pick) => (
                    <tr key={pick.pick}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pick.pick}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pick.round}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          {pick.teamLogo && (
                            <img className="h-6 w-6 mr-2" src={pick.teamLogo} alt={pick.teamName} />
                          )}
                          {pick.teamName}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Picks</h2>
            <DraftPicksTable 
              picks={pastPicks}
              isLoading={false}
            />
          </div>

// ... (rest of the code remains the same)

// DraftPicksTable component props
type DraftPicksTableProps = {
  picks: Array<{
    id: string;
    pick_number: number;
    team?: {
      id: string;
      name: string;
      logo_url: string | null;
    };
    player?: {
      id: string;
      name: string;
      position: string;
    };
    created_at: string;
  }>;
  isLoading: boolean;
};

// DraftPicksTable component
const DraftPicksTable = ({ picks, isLoading }: DraftPicksTableProps) => {
  if (isLoading) return <div>Loading...</div>;
  if (!picks.length) return <div>No draft picks yet</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pick #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Team
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {picks.map((pick) => (
            <tr key={pick.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{pick.pick_number}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {pick.team?.logo_url && (
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={pick.team.logo_url} alt="" />
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{pick.team?.name || 'No team'}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {pick.player ? `${pick.player.name} (${pick.player.position})` : 'No player selected'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ... (rest of the code remains the same)
