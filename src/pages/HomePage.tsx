import { useMemo, useCallback } from 'react';
import { useDraft } from '../context/DraftContext/useDraft';
import { useAuth } from '../context/AuthContext/useAuth';
import DraftBoard from '../components/DraftBoard';
import type { Player, PlayerPosition } from '../services/supabase';
import { getPositionAbbreviation } from '../utils/playerUtils';
import LoadingSpinner from '../components/LoadingSpinner';

// Removed unused interface

const positionOrder: Record<string, number> = {
  'Point Guard': 1,
  'Shooting Guard': 2,
  'Lock': 3,
  'Power Forward': 4,
  'Center': 5,
};

const HomePage = () => {
  const { user } = useAuth();
  const { 
    teams, 
    currentPick, 
    isLoading, 
    togglePause, 
    resetDraft, 
    isPaused, 
    timeLeft, 
    selectPlayer, 
    players: availablePlayers,
    playersQuery
  } = useDraft();

  // Use availablePlayers instead of playersQuery.data
  const players = useMemo(() => availablePlayers || [], [availablePlayers]);

  const currentTeam = useMemo(() => {
    if (!teams.length || !currentPick) return undefined;
    
    // Sort teams by their draft_order to ensure correct snake draft order
    const sortedTeams = [...teams].sort((a, b) => (a.draft_order || 0) - (b.draft_order || 0));
    const pickNumber = typeof currentPick === 'number' ? currentPick : (currentPick as { pick_number?: number }).pick_number || 1;
    const round = Math.ceil(pickNumber / sortedTeams.length);
    const pickInRound = ((pickNumber - 1) % sortedTeams.length) + 1;
    
    // For odd rounds: 1, 2, 3, ...
    // For even rounds: ..., 3, 2, 1
    const teamIndex = round % 2 === 1 
      ? pickInRound - 1  // 0-based index for odd rounds
      : sortedTeams.length - pickInRound;  // Reverse order for even rounds
    
    return sortedTeams[teamIndex];
  }, [teams, currentPick]);
  
  const isAdmin = user?.email?.endsWith('@admin.com') ?? false;

  const handleSelectPlayer = useCallback((player: Player) => {
    selectPlayer(player.id);
  }, [selectPlayer]);

  // Memoize the players by position calculation
  const { playersByPosition, sortedPositions } = useMemo(() => {
    if (!players?.length) {
      return { playersByPosition: {}, sortedPositions: [] };
    }

    const grouped = players.reduce<Record<string, Player[]>>((acc: Record<string, Player[]>, player: Player) => {
      const position = player.position || 'Flex';
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(player);
      return acc;
    }, {});

    const sorted = Object.keys(grouped).sort(
      (a, b) => (positionOrder[a] || 999) - (positionOrder[b] || 999)
    );

    return {
      playersByPosition: grouped,
      sortedPositions: sorted,
    };
  }, [players]);

  if (isLoading || playersQuery.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <DraftBoard 
        currentTeam={currentTeam}
        currentPick={currentPick}
        timeLeft={timeLeft}
        isPaused={isPaused}
        onTogglePause={togglePause}
        onResetDraft={resetDraft}
        isAdmin={isAdmin}
      />
      
      <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
          <h2 className="text-lg font-medium text-gray-900">
            Available Players <span className="text-gray-500">({players.length})</span>
          </h2>
        </div>
        
        {players.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No players available for drafting
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedPositions.map((position) => {
              const positionPlayers = playersByPosition[position];
              return (
                <div key={position} className="p-4">
                  <h3 className="text-md font-medium text-gray-700 mb-2">
                    {position} <span className="text-gray-500">({positionPlayers.length})</span>
                  </h3>
                  <ul className="space-y-2">
                    {positionPlayers.map((player: Player) => (
                      <PlayerItem 
                        key={player.id}
                        player={player}
                        onSelect={handleSelectPlayer}
                        disabled={isPaused}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface PlayerItemProps {
  player: Player;
  onSelect: (player: Player) => void;
  disabled: boolean;
}

const PlayerItem = ({ player, onSelect, disabled }: PlayerItemProps) => (
  <li className="px-4 py-2 hover:bg-gray-50 rounded transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{player.name}</p>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getPositionAbbreviation(player.position as PlayerPosition)}
          </span>
          {player.team_name && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {player.team_name}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onSelect(player)}
        disabled={disabled}
        className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-105 active:scale-95 ${
          disabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-brand-blue-600 text-white border-transparent hover:bg-brand-blue-700 focus:ring-brand-blue-500'
        }`}
        aria-label={`Draft ${player.name}`}
      >
        Draft
      </button>
    </div>
  </li>
);

export default HomePage;
