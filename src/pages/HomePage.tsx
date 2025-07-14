import { useMemo, useCallback } from 'react';
import { useDraft } from '../context/DraftContext/useDraft';
import { useAuth } from '../context/AuthContext/useAuth';
import DraftBoard from '../components/DraftBoard';
import type { Player, PlayerPosition } from '../services/supabase';
import { getPositionAbbreviation } from '../utils/playerUtils';
import LoadingSpinner from '../components/LoadingSpinner';

interface PlayersByPosition {
  [key: string]: Player[];
}

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
    players,
    currentPick, 
    isLoading, 
    togglePause,
    resetDraft,
    isPaused,
    timeLeft,
    selectPlayer
  } = useDraft();

  const currentTeam = useMemo(
    () => teams[(currentPick - 1) % teams.length],
    [teams, currentPick]
  );
  
  const isAdmin = user?.email?.endsWith('@admin.com') ?? false;

  const handleSelectPlayer = useCallback((player: Player) => {
    selectPlayer(player.id);
  }, [selectPlayer]);

  // Memoize the players by position calculation
  const { playersByPosition, sortedPositions } = useMemo(() => {
    const grouped = players.reduce<PlayersByPosition>((acc, player) => {
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

  if (isLoading) {
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
      
 codex/update-button-and-card-effects
      <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="px-6 py-4 border-b border-gray-200">
=======
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
 main
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
                    {positionPlayers.map((player) => (
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
