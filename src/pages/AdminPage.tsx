import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import FileUpload from '../components/FileUpload';
import { playersApi, teamsApi, eventsApi, type PlayerPosition, type Event } from '../services/supabase';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

type EventFormData = {
  name: string;
  date: string;
  numTeams: number;
  picksPerTeam: number;
  pickTimeSeconds: number;
  prizePool: string;
};

type PlayerFormData = {
  gt_psn: string;
  position: PlayerPosition | '';
};

type TeamFormData = {
  name: string;
  logoUrl: string | null;
  logoFile?: File | null;
};

const positionOptions: PlayerPosition[] = [
  'Point Guard',
  'Shooting Guard',
  'Lock',
  'Power Forward',
  'Center',
];

const AdminPage = () => {
  const navigate = useNavigate();
  const { currentEventId, setCurrentEventId } = useApp();
  const [playerForm, setPlayerForm] = useState<PlayerFormData>({
    gt_psn: '',
    position: ''
  });
  
  const [teamForm, setTeamForm] = useState<TeamFormData>({
    name: '',
    logoUrl: null,
    logoFile: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormData>({
    name: '',
    date: '',
    numTeams: 12,
    picksPerTeam: 15,
    pickTimeSeconds: 60,
    prizePool: ''
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  
  const updateEventForm = (updates: Partial<EventFormData>) => {
    setEventForm(prev => ({ ...prev, ...updates }));
  };
  
  // Handle event selection change
  const handleEventChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEventId = event.target.value;
    if (selectedEventId) {
      setCurrentEventId(selectedEventId);
    } else {
      setCurrentEventId(null);
    }
  };
  
  // Get current event details
  const currentEvent = events.find((event: Event) => event.id === currentEventId);

  // No draft management functions for now
  
  // Update player form
  const updatePlayerForm = (updates: Partial<PlayerFormData>) => {
    setPlayerForm(prev => ({ ...prev, ...updates }));
  };
  
  // Update team form
  const updateTeamForm = (updates: Partial<TeamFormData>) => {
    setTeamForm(prev => ({ ...prev, ...updates }));
  };

  const uploadLogo = async (file: File | null): Promise<string | null> => {
    if (!file) return null;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
      return null;
    }
    
    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('File is too large. Maximum size is 2MB.');
      return null;
    }
    
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `team-logos/${fileName}`;
      
      // First, check if the bucket exists
      const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        throw new Error('Failed to access storage. Please try again later.');
      }
      
      const bucketExists = bucketList?.some(bucket => bucket.name === 'team-logos');
      if (!bucketExists) {
        console.error('Storage bucket does not exist');
        throw new Error('Storage configuration error. Please contact support.');
      }
      
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('The resource already exists')) {
          throw new Error('A file with this name already exists. Please rename your file and try again.');
        } else if (uploadError.message.includes('not found')) {
          throw new Error('Storage bucket not found. Please contact support.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }
      
      if (!uploadData) {
        throw new Error('Upload failed: No data returned from storage');
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('team-logos')
        .getPublicUrl(filePath);
      
      if (!publicUrl) {
        throw new Error('Failed to generate public URL for the uploaded file');
      }
      
      return publicUrl;
    } catch (error) {
      console.error('Logo upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload';
      toast.error(`Upload failed: ${errorMessage}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerForm.gt_psn.trim() || !playerForm.position) {
      toast.error('Player name and position are required');
      return;
    }
    
    if (!currentEventId) {
      toast.error('Please select an event first');
      return;
    }
    
    try {
      await playersApi.create(
        playerForm.gt_psn.trim(), 
        playerForm.position as PlayerPosition,
        currentEventId
      );
      toast.success('Player added successfully');
      setPlayerForm({ "gt_psn": '', position: '' });
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error(`Failed to add player: ${(error as Error).message}`);
    }
  };

  // Helper function to validate UUID format
  const isValidUuid = (uuid: string | null): boolean => {
    if (!uuid) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamForm.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    
    // Enhanced validation for event ID
    if (!currentEventId) {
      toast.error('Please select an event first');
      return;
    }
    
    if (!isValidUuid(currentEventId)) {
      console.error('Invalid event ID format:', currentEventId);
      toast.error('Invalid event selected. Please refresh the page and try again.');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // If we have a logo file, upload it first
      let logoUrl = teamForm.logoUrl;
      if (teamForm.logoFile) {
        try {
          const uploadedUrl = await uploadLogo(teamForm.logoFile);
          if (uploadedUrl) {
            logoUrl = uploadedUrl;
          } else {
            toast.error('Failed to upload team logo. Please try again.');
            return;
          }
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
          toast.error('Failed to upload team logo. The file may be too large or in an unsupported format.');
          return;
        }
      }
      
      try {
        // Double-check event ID is still valid before API call
        if (!isValidUuid(currentEventId)) {
          throw new Error('Invalid event ID. Please select a valid event and try again.');
        }
        
        const team = await teamsApi.create(
          teamForm.name.trim(), 
          logoUrl || '', // Ensure we pass a string, not null
          currentEventId
        );
        
        if (team) {
          toast.success('Team added successfully');
          setTeamForm({ 
            name: '', 
            logoUrl: null,
            logoFile: null 
          });
        } else {
          throw new Error('Failed to create team. Please try again.');
        }
      } catch (apiError) {
        console.error('Team creation API error:', apiError);
        let errorMessage = 'Failed to create team. Please try again.';
        
        // Handle specific error cases
        if (apiError instanceof Error) {
          if (apiError.message.includes('duplicate key value violates unique constraint')) {
            errorMessage = 'A team with this name already exists for the selected event.';
          } else if (apiError.message.includes('invalid input syntax for type uuid')) {
            errorMessage = 'Invalid event selected. Please refresh the page and try again.';
          } else {
            errorMessage = apiError.message || errorMessage;
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error in handleAddTeam:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to add team: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleLogoChange = async (file: File | null) => {
    setTeamForm(prev => ({
      ...prev,
      logoFile: file,
      // If we're clearing the file, keep the existing URL if there is one
      logoUrl: file ? prev.logoUrl : null
    }));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventForm.name.trim()) {
      toast.error('Event name is required');
      return;
    }
    
    setIsCreatingEvent(true);
    
    try {
      // Create event with required fields first
      const newEvent = await eventsApi.create(
        eventForm.name.trim(),
        eventForm.date || null,
        true, // isActive
        'snake', // draftType
        eventForm.numTeams,
        eventForm.pickTimeSeconds,
        eventForm.picksPerTeam,
        eventForm.prizePool ? parseFloat(eventForm.prizePool) : null
      );
      
      if (newEvent) {
        setEvents(prev => [...prev, newEvent]);
        setCurrentEventId(newEvent.id);
        setShowEventForm(false);
        setEventForm({
          name: '',
          date: '',
          numTeams: 12,
          picksPerTeam: 15,
          pickTimeSeconds: 60,
          prizePool: ''
        });
        
        toast.success('Event created successfully!');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(`Failed to create event: ${(error as Error).message}`);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const data = await eventsApi.getAll();
        setEvents(data);
        
        // If there's no current event but events exist, set the first one
        if (!currentEventId && data.length > 0) {
          setCurrentEventId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
    
    // No real-time subscription for now to avoid TypeScript errors
    // We'll implement this later when we have the proper types
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
                  onChange={(e) => setEventForm({ ...eventForm, numTeams: parseInt(e.target.value, 10) })}
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
                  onChange={(e) => setEventForm({ ...eventForm, picksPerTeam: parseInt(e.target.value, 10) })}
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
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Event Management */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Current Event: {currentEvent?.name || 'None selected'}
            </h2>
            <button
              type="button"
              onClick={() => setShowEventForm(!showEventForm)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showEventForm ? 'Cancel' : 'New Event'}
            </button>
          </div>

          {events.length > 0 && (
            <div className="mt-2">
              <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Switch Event
              </label>
              <select
                id="eventSelect"
                aria-label="Select event"
                value={currentEventId || ''}
                onChange={handleEventChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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

        {showEventForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium mb-4">Create New Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
                  Event Name *
                </label>
                <input
                  type="text"
                  id="eventName"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
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
                    onChange={(e) => setEventForm({ ...eventForm, numTeams: parseInt(e.target.value, 10) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {/* Add any other form fields here as needed */}
              </div>

              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Create Event
              </button>
            </form>
          </div>
        )}
        </div>

        {/* Player Management */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Player</h2>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
                Player Name *
              </label>
              <input
                type="text"
                id="playerName"
                value={playerForm.gt_psn}
                onChange={(e) => updatePlayerForm({ gt_psn: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                value={playerForm.position}
                onChange={(e) => updatePlayerForm({ position: e.target.value as PlayerPosition })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a position</option>
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Event
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">
                  Team Name *
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamForm.name}
                  onChange={(e) => updateTeamForm({ name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Los Angeles Lakers"
                  required
                />
              </div>

              <div className="col-span-2">
                <FileUpload
                  onFileSelect={handleLogoChange}
                  currentUrl={typeof teamForm.logoUrl === 'string' ? teamForm.logoUrl : undefined}
                  label="Team Logo (optional)"
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Add Team
                </button>
              </div>
            </form>
          )}
        </div>

        {/* The rest of your AdminPage content continues here... */}
    </div>
  );
}

export default AdminPage;
