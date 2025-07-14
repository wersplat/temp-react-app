import type { Team, DraftPick } from '../services/supabase';

interface DraftPicksTableProps {
  draftPicks: DraftPick[];
  teams: Team[];
}

// Explicit return type for better type safety
type DraftPicksTableComponent = (props: DraftPicksTableProps) => React.JSX.Element;

const DraftPicksTable: DraftPicksTableComponent = ({ draftPicks, teams }) => {
  const renderDraftPicks = () => {
    return draftPicks.slice().reverse().map((pick: DraftPick) => (
      <tr key={pick.id} className="hover:bg-gray-50 hover:shadow transition-shadow">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {pick.pick}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {teams.find((t: Team) => t.id === pick.team_id)?.name || 'Unknown Team'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {typeof pick.player === 'string' ? pick.player : pick.player?.name || 'Unknown Player'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {/* Position not available in current schema */}
        </td>
      </tr>
    ));
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Picks</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pick
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
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
            {draftPicks.length > 0 ? (
              renderDraftPicks()
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No picks have been made yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DraftPicksTable;
