import { memo, useMemo } from 'react';
import type { Team, Player, DraftPick, PlayerPosition } from '../services/supabase';
import { getPositionAbbreviation } from '../utils/playerUtils';
import TeamHeader from './TeamHeader';
import DraftPicksList from './DraftPicksList';
import AvailablePlayersList from './AvailablePlayersList';

/**
 * Props for the TeamCard component.
 * @interface TeamCardProps
 * @property {Team} team - The team data to display
 * @property {DraftPick[]} picks - Array of draft picks for the team
 * @property {Player[]} players - Array of all players (used to resolve player details for picks)
 * @property {boolean} [isCurrentTeam=false] - Whether this team is currently on the clock
 * @property {(player: Player) => void} [onSelectPlayer] - Callback when a player is selected
 * @property {boolean} [isDraftInProgress=true] - Whether the draft is currently in progress
 */
interface TeamCardProps {
  team: Team & { logo_url?: string | null };
  picks: Array<DraftPick & { player: Player | null }>;
  players: Player[];
  isCurrentTeam?: boolean;
  onSelectPlayer?: (player: Player) => void;
  isDraftInProgress?: boolean;
  eventId?: string;
}

/**
 * A card component that displays team information, draft picks, and available players.
 * 
 * @component
 * @example
 * const team = { id: '1', name: 'Team A', logo_url: 'url-to-logo' };
 * const picks = [{ id: '1', pick_number: 1, team_id: '1', player_id: '101' }];
 * const players = [{ id: '101', name: 'John Doe', position: 'QB', team: 'DAL', available: false }];
 * 
 * return (
 *   <TeamCard 
 *     team={team}
 *     picks={picks}
 *     players={players}
 *     isCurrentTeam={true}
 *     onSelectPlayer={(player) => console.log('Player selected:', player)}
 *     isDraftInProgress={true}
 *   />
 * );
 */
const TeamCard: React.FC<TeamCardProps> = ({
  team,
  picks = [],
  players = [],
  isCurrentTeam = false,
  onSelectPlayer,
  isDraftInProgress = true,
}) => {
  // Memoize the transformation of picks to include player details
  const picksWithPlayers = useMemo(() => 
    picks
      .filter((pick): pick is DraftPick & { player: Player } => 
        pick.player !== null && typeof pick.player !== 'string'
      )
      .map(pick => ({
        ...pick,
        player: pick.player as Player
      })),
    [picks]
  );

  // Memoize the position counts calculation
  const positionCounts = useMemo(() => 
    picksWithPlayers.reduce<Record<string, number>>((acc, { player }) => {
      const position = player.position || 'Flex';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {}),
    [picksWithPlayers]
  );

  /**
   * Determines the team's positional needs based on current roster.
   * @returns {string[]} Array of position needs in the format "POS (current/required)"
   */
  // Memoize the team needs calculation
  const needs = useMemo(() => {
    const needsList: string[] = [];
    const positionRequirements: Record<string, number> = {
      'Point Guard': 1,
      'Shooting Guard': 1,
      'Small Forward': 1,
      'Power Forward': 1,
      'Center': 1,
      'Guard': 1,
      'Forward': 1,
      'Utility': 1,
      'Flex': 1
    };

    Object.entries(positionRequirements).forEach(([position, required]) => {
      const current = positionCounts[position] || 0;
      if (current < required) {
        const abbrev = getPositionAbbreviation(position as PlayerPosition);
        needsList.push(`${abbrev} (${current}/${required})`);
      }
    });

    return needsList.length > 0 ? needsList : ['No immediate needs'];
  }, [positionCounts]);

  return (
    <article
      className={`bg-white rounded-lg shadow overflow-hidden w-full hover:shadow-lg transition-shadow ${
        isCurrentTeam ? 'ring-2 ring-brand-blue-500' : ''
      } animate-fade-in`}
      aria-labelledby={`team-${team.id}-name`}
      aria-describedby={`team-${team.id}-picks`}
    >
      <TeamHeader 
        team={team} 
        picksCount={picks.length} 
        needs={needs} 
        isCurrentTeam={isCurrentTeam} 
      />

      {/* Team Picks */}
      <div className="border-t border-gray-200">
        <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-50">
          <h4 id={`team-${team.id}-picks`} className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Draft Picks
          </h4>
        </div>
        <div className="divide-y divide-gray-200">
          <DraftPicksList picks={picksWithPlayers} />
        </div>
      </div>

      {/* Available Players (only show for current team during draft) */}
      {isCurrentTeam && isDraftInProgress && onSelectPlayer && (
        <div className="border-t border-gray-200">
          <div id={`team-${team.id}-available`} className="sr-only">
            Available players for {team["GT_PSN"]}. Use arrow keys to navigate and Enter to select a player.
          </div>
          <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-50">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Available Players
            </h4>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <AvailablePlayersList 
              players={players} 
              teamId={team.id} 
              onSelectPlayer={onSelectPlayer} 
            />
          </div>
        </div>
      )}
    </article>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(TeamCard) as React.FC<TeamCardProps>;
