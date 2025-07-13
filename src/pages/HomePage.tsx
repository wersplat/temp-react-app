import { useDraft } from '../context/DraftContext/useDraft';
import { useAuth } from '../context/AuthContext/useAuth';
import DraftBoard from '../components/DraftBoard';
import type { Player, PlayerPosition } from '../services/supabase';
import { getPositionAbbreviation } from '../utils/playerUtils';

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

  const currentTeam = teams[(currentPick - 1) % teams.length];
  const isAdmin = user?.email?.endsWith('@admin.com') ?? false;

  const handleSelectPlayer = (player: Player) => {
    selectPlayer(player.id);
  };

  // Get undrafted players (players not yet picked in the draft)
  // In the new schema, we'll assume all players in the players array are available for drafting
  // since the draft picks are stored separately
  const undraftedPlayers = [...players];

  // Group players by position for better organization
  const playersByPosition = undraftedPlayers.reduce<Record<string, Player[]>>((acc, player) => {
    const position = player.position || 'Flex';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(player);
    return acc;
  }, {});
  
  // Sort positions in a logical order
  const positionOrder: Record<string, number> = {
    'Point Guard': 1,
    'Shooting Guard': 2,
    'Small Forward': 3,
    'Power Forward': 4,
    'Center': 5,
    'Guard': 6,
    'Forward': 7,
    'Utility': 8,
    'Flex': 9
  };
  
  const sortedPositions = Object.keys(playersByPosition).sort((a, b) => 
    (positionOrder[a] || 999) - (positionOrder[b] || 999)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DraftBoard 
        currentTeam={currentTeam}
        currentPick={currentPick}
        timeLeft={timeLeft}
        isPaused={isPaused}
        onTogglePause={togglePause}
        onResetDraft={resetDraft}
        isAdmin={isAdmin}
      />
      
      {/* Available Players */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available Players ({undraftedPlayers.length})</h3>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
          {undraftedPlayers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No players available for drafting
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedPositions.map((position) => {
                const positionPlayers = playersByPosition[position];
                return (
                  <div key={position} className="p-4">
                    <h4 className="text-md font-medium text-gray-700 mb-2">{position} ({positionPlayers.length})</h4>
                    <ul className="space-y-2">
                      {positionPlayers.map((player) => (
                        <li key={player.id} className="px-4 py-2 hover:bg-gray-50 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{player.name}</p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
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
                              onClick={() => handleSelectPlayer(player)}
                              className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isPaused 
                                  ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 focus:ring-indigo-500'
                              }`}
                              disabled={isPaused}
                            >
                              Draft
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
