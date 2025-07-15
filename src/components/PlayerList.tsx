import type { Player } from '../services/supabase';
import { getPositionAbbreviation } from '../utils/playerUtils';

/**
 * Props for the PlayerList component.
 * @interface PlayerListProps
 * @property {Player[]} players - Array of players to display
 * @property {(player: Player) => void} [onSelectPlayer] - Callback when a player is selected
 * @property {boolean} [isLoading=false] - Whether the component is in a loading state
 * @property {string} [emptyStateMessage='No players found'] - Message to display when no players are available
 * @property {boolean} [showTeam=false] - Whether to show the team column
 * @property {boolean} [showPosition=true] - Whether to show the position column
 * @property {string | number} [maxHeight='auto'] - Maximum height of the scrollable container
 * @property {boolean} [showDraftButton=false] - Whether to show the draft button
 * @property {boolean} [isDraftInProgress=false] - Whether the draft is currently in progress (affects button states)
 */
interface PlayerListProps {
  players: Player[];
  onSelectPlayer?: (player: Player) => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
  showTeam?: boolean;
  showPosition?: boolean;
  maxHeight?: string | number;
  showDraftButton?: boolean;
  isDraftInProgress?: boolean;
}

// Position order for sorting players
const positionOrder: Record<string, number> = {
  'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DEF': 6, '': 99,
  'Point Guard': 1, 'Shooting Guard': 2, 'Small Forward': 3, 
  'Power Forward': 4, 'Center': 5, 'Guard': 1, 'Forward': 3,
  'Utility': 6, 'Flex': 7
};

const sortedPlayers = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => {
    // Sort by position
    const aPos = a.position || '';
    const bPos = b.position || '';
    
    if (positionOrder[aPos] !== positionOrder[bPos]) {
      return (positionOrder[aPos] || 99) - (positionOrder[bPos] || 99);
    }
    
    // Then by GT/PSN
    return a["GT/PSN"].localeCompare(b["GT/PSN"]);
  });
};

/**
 * A reusable component for displaying a list of players with sorting and selection capabilities.
 * 
 * @component
 * @example
 * const players = [
 *   { id: '1', "GT/PSN": 'John Doe', position: 'QB', team: 'DAL', available: true },
 *   { id: '2', "GT/PSN": 'Jane Smith', position: 'RB', team: 'SF', available: true }
 * ];
 * 
 * return (
 *   <PlayerList 
 *     players={players}
 *     onSelectPlayer={(player) => console.log('Selected:', player)}
 *     isLoading={false}
 *     showTeam={true}
 *     showPosition={true}
 *     maxHeight="400px"
 *     showDraftButton={true}
 *     isDraftInProgress={true}
 *   />
 * );
 */
const PlayerList = (props: PlayerListProps) => {
  // Destructure props with defaults
  const { 
    players = [], 
    onSelectPlayer, 
    isLoading = false, 
    emptyStateMessage = 'No players found',
    showTeam = false,
    showPosition = true,
    maxHeight = 'auto',
    showDraftButton = false
  } = props;

  // Show loading state if data is being fetched
  if (isLoading) {
    return (
      <div 
        className="flex justify-center items-center p-8"
        role="status"
        aria-live="polite"
        aria-busy={true}
      >
        <div 
          className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue-500"
          aria-hidden="true"
        ></div>
        <span className="sr-only">Loading players...</span>
      </div>
    );
  }

  // Show empty state if no players are available
  if (players.length === 0) {
    return (
      <div 
        className="p-6 text-center text-gray-500"
        role="status"
        aria-live="polite"
      >
        {emptyStateMessage}
      </div>
    );
  }

  return (
    <div 
      className="overflow-x-auto" 
      style={{ maxHeight }}
      role="region"
      aria-label="Players list"
      tabIndex={0}
    >
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              id="player-name-header"
            >
              Player
            </th>
            {showPosition && (
              <th 
                scope="col" 
                className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                id="player-position-header"
              >
                Position
              </th>
            )}
            {showTeam && (
              <th 
                scope="col" 
                className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                id="player-team-header"
              >
                <span className="hidden sm:inline">Player</span>
                <span className="sm:hidden">Player Info</span>
              </th>
            )}
            {showDraftButton && onSelectPlayer && (
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Draft</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedPlayers(players).map((player) => (
            <tr
              key={player.id}
              className="hover:bg-gray-50 hover:shadow cursor-pointer transition-shadow"
              onClick={() => onSelectPlayer?.(player)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelectPlayer) {
                  e.preventDefault();
                  onSelectPlayer(player);
                }
              }}
              tabIndex={0}
              aria-label={`Select ${player.name}, ${player.position}, ${player.team_name}`}
            >
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-medium">
                      {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {player["GT/PSN"]}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs sm:text-xs font-medium bg-blue-100 text-blue-800 mr-1 sm:mr-2">
                        {getPositionAbbreviation(player.position)}
                      </span>
                      {showTeam && player.team_name && (
                        <span className="truncate" id={`player-team-${player.id}`}>
                          {player.team_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              {showTeam && (
                <td className="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900" aria-labelledby={`player-team-${player.id} player-team-header`}>
                    {player.team_name || 'FA'}
                  </div>
                </td>
              )}
              {showDraftButton && onSelectPlayer && (
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-brand-blue-600 hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500"
                    onClick={() => onSelectPlayer?.(player)}
                    aria-label={`Select ${player.name}`}
                  >
                    <span className="hidden sm:inline">Draft</span>
                    <span className="sm:hidden">+</span>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerList;
