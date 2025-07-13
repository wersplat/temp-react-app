import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { playersApi, teamsApi, type PlayerPosition } from '../services/supabase';
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

  return (
    <div className="space-y-8">
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
