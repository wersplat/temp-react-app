import { memo } from 'react';
import type { DraftPick, Player } from '../services/supabase';
import { getPositionAbbreviation } from '../utils/playerUtils';

interface DraftPicksListProps {
  picks: Array<DraftPick & { player: Player }>;
}

/**
 * Displays a list of draft picks for a team
 */
const DraftPicksList: React.FC<DraftPicksListProps> = ({ picks }) => {
  if (picks.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-gray-500">
        No picks made yet
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
      {picks.map((pick) => (
        <li key={`${pick.team_id}-${pick.pick}`} className="px-3 py-2 sm:px-4 sm:py-3 hover:bg-gray-50">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 text-sm font-medium text-gray-500">
              {pick.pick}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {pick.player.name}
              </div>
              <div className="flex items-center mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium bg-blue-100 text-blue-800 mr-2">
                  {getPositionAbbreviation(pick.player.position)}
                </span>
                {pick.player.team_name && (
                  <span className="text-xs text-gray-500">
                    {pick.player.team_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(
  DraftPicksList,
  (prevProps, nextProps) => {
    // Only re-render if the picks array reference changes
    return prevProps.picks === nextProps.picks;
  }
) as React.FC<DraftPicksListProps>;
