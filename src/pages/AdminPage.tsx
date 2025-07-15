import { useState } from 'react';
import type { Event, Team, Player, PlayerPosition } from '../types';

const createBaseEvent = (name: string): Event => {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}`,
    name,
    date: now,
    num_teams: 0,
    picks_per_team: 0,
    pick_time_seconds: 0,
    prize_pool: null,
    is_active: true,
    created_at: now,
    updated_at: now,
    draft_type: 'snake',
    created_by: null
  };
};

const AdminPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [eventName, setEventName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>('Point Guard');

  const addEvent = () => {
    const event = createBaseEvent(eventName);
    setEvents(prev => [...prev, event]);
    setEventName('');
  };

  const addTeam = () => {
    if (!events.length) return;
    const now = new Date().toISOString();
    const team: Team = {
      id: `${Date.now()}`,
      name: teamName,
      logo_url: null,
      event_id: events[0].id,
      draft_order: null,
      created_at: now,
      updated_at: now
    };
    setTeams(prev => [...prev, team]);
    setTeamName('');
  };

  const addPlayer = () => {
    if (!events.length) return;
    const now = new Date().toISOString();
    const player: Player = {
      id: `${Date.now()}`,
      name: playerName,
      position: playerPosition,
      event_id: events[0].id,
      created_at: now,
      updated_at: now
    };
    setPlayers(prev => [...prev, player]);
    setPlayerName('');
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Admin Page</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">Events</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            className="border rounded px-2 py-1 flex-1"
            placeholder="Event name"
            value={eventName}
            onChange={e => setEventName(e.target.value)}
          />
          <button
            type="button"
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={addEvent}
            disabled={!eventName}
          >
            Add
          </button>
        </div>
        <ul className="mt-3 list-disc list-inside space-y-1">
          {events.map(event => (
            <li key={event.id}>{event.name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Teams</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            className="border rounded px-2 py-1 flex-1"
            placeholder="Team name"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
          />
          <button
            type="button"
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={addTeam}
            disabled={!teamName || !events.length}
          >
            Add
          </button>
        </div>
        <ul className="mt-3 list-disc list-inside space-y-1">
          {teams.map(team => (
            <li key={team.id}>{team.name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Players</h2>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            className="border rounded px-2 py-1 flex-1"
            placeholder="Player name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1"
            value={playerPosition}
            onChange={e => setPlayerPosition(e.target.value as PlayerPosition)}
          >
            <option value="Point Guard">Point Guard</option>
            <option value="Shooting Guard">Shooting Guard</option>
            <option value="Small Forward">Small Forward</option>
            <option value="Power Forward">Power Forward</option>
            <option value="Center">Center</option>
          </select>
          <button
            type="button"
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={addPlayer}
            disabled={!playerName || !events.length}
          >
            Add
          </button>
        </div>
        <ul className="mt-3 list-disc list-inside space-y-1">
          {players.map(player => (
            <li key={player.id}>
              {player.name} - {player.position}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminPage;
