import type { Team, DraftPick } from '../services/supabase';
import React from 'react';
import { StarIcon, TrophyIcon, UserIcon, UsersIcon } from '@heroicons/react/24/outline';

interface DraftPicksTableProps {
  draftPicks: DraftPick[];
  teams: Team[];
}

// Explicit return type for better type safety
type DraftPicksTableComponent = (props: DraftPicksTableProps) => React.JSX.Element;

const DraftPicksTable: DraftPicksTableComponent = ({ draftPicks, teams }) => {
  const renderDraftPicks = () => {
    if (draftPicks.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
            <div className="flex flex-col items-center justify-center space-y-2">
              <TrophyIcon className="h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No draft picks yet</p>
              <p className="text-sm">Check back later for updates</p>
            </div>
          </td>
        </tr>
      );
    }

    return draftPicks.slice().reverse().map((pick: DraftPick, index: number) => {
      const team = teams.find((t: Team) => t.id === pick.team_id);
      const isTopPick = index < 5; // Highlight top 5 picks
      
      return (
        <tr 
          key={pick.id} 
          className={`transition-colors duration-150 ${
            isTopPick 
              ? 'bg-yellow-50 hover:bg-yellow-100' 
              : index % 2 === 0 
                ? 'bg-white hover:bg-gray-50' 
                : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            <div className="flex items-center">
              {isTopPick && <StarIcon className="h-4 w-4 text-yellow-500 mr-2" />}
              <span className={`${isTopPick ? 'font-bold' : ''}`}>#{pick.pick}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              {team?.logo_url ? (
                <img 
                  src={team.logo_url} 
                  alt={team.name} 
                  className="h-8 w-8 rounded-full bg-white p-1 border border-gray-200 mr-3"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {team?.name || 'Unknown Team'}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <UserIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {typeof pick.player === 'string' ? pick.player : pick.player?.name || 'Unknown Player'}
                </div>
                <div className="text-xs text-gray-500">
                  {typeof pick.player === 'object' && pick.player?.position ? pick.player.position : '—'}
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button
              type="button"
              className="text-primary-600 hover:text-primary-900"
              onClick={() => console.log('View details for pick', pick.id)}
            >
              View
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border border-gray-200 rounded-lg">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Draft Picks</h2>
              <p className="mt-1 text-sm text-primary-100">
                {draftPicks.length} total picks • {teams.length} teams participating
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100"
                    >
                      Pick #
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100"
                    >
                      Team
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100"
                    >
                      Player
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100"
                    >
                      Actions
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
            
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
                    <span className="font-medium">{draftPicks.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="bg-primary-50 border-primary-500 text-primary-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      1
                    </button>
                    <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      2
                    </button>
                    <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      3
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftPicksTable;
