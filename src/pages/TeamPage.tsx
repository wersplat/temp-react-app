import { useParams } from 'react-router-dom';
import { useDraft } from '../context/DraftContext/useDraft';
import type { Team, DraftPick } from '../services/supabase';

const TeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { teams, draftPicks } = useDraft();

  // Find the current team
  const team = teams.find((t: Team) => t.id === teamId);
  

  
  // Filter and sort picks for this team
  const teamPicks = draftPicks
    .filter((pick): pick is DraftPick & { team_id: string; player: string } => 
      pick.team_id !== null && pick.team_id === teamId && !!pick.player
    )
    .sort((a, b) => a.pick - b.pick);

  // Calculate total picks
  const totalPicks = teamPicks.length;

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
                <span className="text-sm font-medium text-gray-500">Players</span>
                <p className="text-2xl font-semibold">{totalPicks}</p>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Picks */}
      <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Draft Picks</h2>
        </div>
        {teamPicks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No picks made yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pick
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamPicks.map((pick: DraftPick) => (
                    <tr key={pick.id} className="hover:bg-gray-50 hover:shadow transition-shadow">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pick.pick}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {typeof pick.player === 'string' ? pick.player : pick.player?.name || 'Unknown Player'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        N/A
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        N/A
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Needs Analysis */}
      <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
          <h3 className="text-lg font-medium text-gray-900">Team Stats</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500">
            {totalPicks > 0 
              ? `This team has made ${totalPicks} ${totalPicks === 1 ? 'pick' : 'picks'} so far.`
              : 'This team has not made any picks yet.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
