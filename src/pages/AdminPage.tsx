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
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [draftType, setDraftType] = useState<'snake' | 'linear'>('snake');
  const [numTeams, setNumTeams] = useState(12);
  const [pickTimeSeconds, setPickTimeSeconds] = useState<number | null>(60);
  const [picksPerTeam, setPicksPerTeam] = useState(15);
  const [prizePool, setPrizePool] = useState<number | null>(null);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventId) return toast.error('No event selected');
    
    if (!playerName.trim()) {
      toast.error('Player name is required');
      return;
    }
    
    if (!playerPosition) {
      toast.error('Player position is required');
      return;
    }
    
    try {
      await playersApi.create(
        playerName.trim(),
        playerPosition,
        currentEventId
      );
      
      toast.success('Player added successfully');
      
      // Reset form
      setPlayerName('');
      setPlayerPosition('');
    } catch (err) {
      toast.error(`Failed to add player: ${(err as Error).message}`);
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
        isActive,
        draftType,
        numTeams,
        pickTimeSeconds,
        picksPerTeam,
        prizePool
      );
      
      toast.success('Event created successfully');
      
      // Reset form
      setEventName('');
      setEventDate('');
      setIsActive(true);
      setDraftType('snake');
      setNumTeams(12);
      setPickTimeSeconds(60);
      setPicksPerTeam(15);
      setPrizePool(null);
    } catch (err) {
      toast.error(`Failed to create event: ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Event</h2>
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label htmlFor="draftType" className="block text-sm font-medium text-gray-700 mb-1">
                Draft Type
              </label>
              <select
                id="draftType"
                value={draftType}
                onChange={(e) => setDraftType(e.target.value as 'snake' | 'linear')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="snake">Snake Draft</option>
                <option value="linear">Linear Draft</option>
              </select>
            </div>

            <div>
              <label htmlFor="numTeams" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Teams
              </label>
              <input
                type="number"
                id="numTeams"
                min="1"
                value={numTeams}
                onChange={(e) => setNumTeams(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="picksPerTeam" className="block text-sm font-medium text-gray-700 mb-1">
                Picks per Team
              </label>
              <input
                type="number"
                id="picksPerTeam"
                min="1"
                value={picksPerTeam}
                onChange={(e) => setPicksPerTeam(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="pickTimeSeconds" className="block text-sm font-medium text-gray-700 mb-1">
                Pick Time (seconds)
              </label>
              <input
                type="number"
                id="pickTimeSeconds"
                min="0"
                value={pickTimeSeconds || ''}
                onChange={(e) => setPickTimeSeconds(e.target.value ? Number(e.target.value) : null)}
                placeholder="0 for no time limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="prizePool" className="block text-sm font-medium text-gray-700 mb-1">
                Prize Pool ($)
              </label>
              <input
                type="number"
                id="prizePool"
                min="0"
                step="0.01"
                value={prizePool || ''}
                onChange={(e) => setPrizePool(e.target.value ? Number(e.target.value) : null)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Event
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Player</h2>
        <form onSubmit={handleAddPlayer} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
                Player Name *
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. LeBron James"
                required
              />
            </div>
            
            <div>
              <label htmlFor="playerPosition" className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <select
                id="playerPosition"
                value={playerPosition}
                onChange={(e) => setPlayerPosition(e.target.value as PlayerPosition)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
          
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Player
            </button>
          </div>
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
