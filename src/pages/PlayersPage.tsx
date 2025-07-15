import { useMemo } from 'react';
import { useDraft } from '../context/DraftContext/useDraft';
import PlayerList from '../components/PlayerList';
import type { Player } from '../services/supabase';

export default function PlayersPage() {
  const { availablePlayers, playersQuery } = useDraft();
  
  // Group players by position
  const playersByPosition = useMemo(() => {
    if (!availablePlayers) return [];
    
    const positions = new Set(availablePlayers.map((p: Player) => p.position));
    return Array.from(positions).sort().map(position => ({
      position,
      players: availablePlayers
        .filter((p: Player) => p.position === position)
        .sort((a: Player, b: Player) => a.GT/PSN.localeCompare(b.GT/PSN))
    }));
  }, [availablePlayers]);

  if (playersQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (playersQuery.isError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Failed to load players. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Players</h1>
          <p className="mt-2 text-sm text-gray-700">
            Browse all available players in the draft
          </p>
        </div>
      </div>
      
      <div className="mt-8 space-y-8">
        {playersByPosition.length > 0 ? (
          playersByPosition.map(({ position, players }) => (
            <div key={position as string} className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">
                  {position as string} <span className="text-sm text-gray-500">({players.length})</span>
                </h2>
              </div>
              <div className="border-t border-gray-200">
                <PlayerList 
                  players={players}
                  showTeam={true}
                  showPosition={false}
                  onSelectPlayer={() => {}}
                  isDraftInProgress={false}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No players available for drafting</p>
          </div>
        )}
      </div>
    </div>
  );
}
