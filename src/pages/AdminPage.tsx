import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { playersApi, teamsApi, eventsApi, type PlayerPosition } from '../services/supabase';
import { useApp } from '../context/AppContext';

const positionOptions: PlayerPosition[] = [
  'Point Guard',
  'Shooting Guard',
  'Lock',
  'Power Forward',
  'Center',
];

const AdminPage = () => {
  const { currentEventId } = useApp();
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition | ''>('');
  const [teamName, setTeamName] = useState('');
  const [teamLogoUrl, setTeamLogoUrl] = useState('');
  
  // Event form state
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventId) return toast.error('No event selected');
    try {
      await playersApi.create(playerName, playerPosition || null, currentEventId);
      toast.success('Player added');
      setPlayerName('');
      setPlayerPosition('');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventId) return toast.error('No event selected');
    try {
      await teamsApi.create(teamName, currentEventId, teamLogoUrl || null);
      toast.success('Team added');
      setTeamName('');
      setTeamLogoUrl('');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventName.trim()) {
      toast.error('Event name is required');
      return;
    }
    
    try {
      await eventsApi.create(
        eventName.trim(),
        eventDescription.trim() || null,
        eventDate || null,
        isActive
      );
      
      toast.success('Event created successfully');
      
      // Reset form
      setEventName('');
      setEventDescription('');
      setEventDate('');
      setIsActive(true);
    } catch (err) {
      toast.error(`Failed to create event: ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Event</h2>
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              id="eventName"
              type="text"
              placeholder="Enter event name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="eventDescription"
              placeholder="Enter event description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                Event Date
              </label>
              <input
                type="datetime-local"
                id="eventDate"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Add Player</h2>
        <form onSubmit={handleAddPlayer} className="space-y-4">
          <input
            type="text"
            placeholder="Player Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <select
            value={playerPosition}
            onChange={(e) => setPlayerPosition(e.target.value as PlayerPosition)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select position</option>
            {positionOptions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
            Add Player
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Add Team</h2>
        <form onSubmit={handleAddTeam} className="space-y-4">
          <input
            type="text"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Logo URL (optional)"
            value={teamLogoUrl}
            onChange={(e) => setTeamLogoUrl(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
            Add Team
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;
