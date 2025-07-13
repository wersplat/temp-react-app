import type { Player } from '../services/supabase';

interface AvailablePlayersListProps {
  players: Player[];
  teamId: string;
  onSelectPlayer: (player: Player) => void;
}

/**
 * Displays a list of available players that can be drafted by the team
 */
const AvailablePlayersList: React.FC<AvailablePlayersListProps> = ({ 
  players, 
  teamId, 
  onSelectPlayer 
}) => {
  if (players.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-gray-500">
        No available players
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {players
        .slice(0, 5) // Show top 5 available players
        .map((player) => (
          <li key={player.id} className="px-3 py-2 sm:px-4 hover:bg-gray-50">
            <button
              onClick={() => onSelectPlayer(player)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPlayer(player);
                }
              }}
              className="w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md p-2"
              aria-describedby={`team-${teamId}-available`}
              aria-label={`Select ${player.name}, ${player.position || 'Flex'}${player.team_name ? `, ${player.team_name}` : ''}`}
              tabIndex={0}
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {player.name}
              </p>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                  {player.position || 'Flex'}
                </span>
                {player.team_name && (
                  <span className="truncate">{player.team_name}</span>
                )}
              </p>
            </button>
          </li>
        ))}
    </ul>
  );
};

export default AvailablePlayersList;
