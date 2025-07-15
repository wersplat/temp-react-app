import { useParams } from 'react-router-dom';
import { useDraft } from '../context/DraftContext/useDraft';
import type { Team, DraftPick } from '../services/supabase';

// Helper function to get round number from pick number
const getRoundNumber = (pickNumber: number, totalTeams: number) => {
  return Math.ceil(pickNumber / totalTeams);
};

// Helper function to get pick in round
const getPickInRound = (pickNumber: number, totalTeams: number) => {
  return ((pickNumber - 1) % totalTeams) + 1;
};

const TeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { teams, draftPicks } = useDraft();

  // Find the current team
  const team = teams.find((t: Team) => t.id === teamId);
  
  // Filter and sort picks for this team
  const teamPicks = draftPicks
    .filter((pick): pick is DraftPick & { team_id: string; player: any } => 
      pick.team_id !== null && pick.team_id === teamId && !!pick.player
    )
    .sort((a, b) => a.pick - b.pick);

  // Calculate total picks and rounds
  const totalPicks = teamPicks.length;
  const totalTeams = teams.length;
  
  // Group picks by round
  const picksByRound = teamPicks.reduce<Record<number, (DraftPick & { player: any })[]>>((acc, pick) => {
    const round = getRoundNumber(pick.pick, totalTeams);
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(pick);
    return acc;
  }, {});
  
  // Get all round numbers that have picks
  const rounds = Object.keys(picksByRound).map(Number).sort((a, b) => a - b);

  if (!team) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Team not found</h3>
        <p className="mt-2 text-sm text-gray-500">The requested team could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Team Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {team?.logo_url ? (
                <img 
                  className="h-24 w-24 rounded-full" 
                  src={team.logo_url} 
                  alt={`${team?.name || 'Team'} logo`} 
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-400">
                  {team?.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Picks</span>
                  <p className="text-2xl font-semibold">{totalPicks}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Rounds</span>
                  <p className="text-2xl font-semibold">{rounds.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Draft Picks by Round */}
      <div className="space-y-6">
        {rounds.length > 0 ? (
          rounds.map((round) => (
            <div key={round} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
                <h2 className="text-lg font-medium text-gray-900">
                  Round {round} 
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({picksByRound[round].length} {picksByRound[round].length === 1 ? 'pick' : 'picks'})
                  </span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pick
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overall
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {picksByRound[round].map((pick) => (
                      <tr key={pick.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getPickInRound(pick.pick, totalTeams)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{pick.pick}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {typeof pick.player === 'string' ? pick.player : pick.player?.gt_psn || 'Unknown Player'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pick.player?.position || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <p className="text-gray-500">No draft picks made yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
