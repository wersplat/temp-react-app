import type { Team } from '../services/supabase';

interface TeamHeaderProps {
  team: Team & { logo_url?: string | null };
  picksCount: number;
  needs: string[];
  isCurrentTeam: boolean;
}

/**
 * Displays the team's header with logo, name, and basic info
 */
const TeamHeader: React.FC<TeamHeaderProps> = ({ 
  team, 
  picksCount, 
  needs, 
  isCurrentTeam 
}) => (
  <div className="px-3 py-4 sm:px-4 md:px-6 bg-gray-50">
    <div className="flex items-start sm:items-center">
      {team.logo_url ? (
        <img 
          className="h-10 w-10 rounded-full"
          src={team.logo_url}
          alt={`${team.name} logo`}
        />
      ) : (
        <div 
          className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg sm:text-xl font-bold text-gray-500 mr-3 sm:mr-4"
          aria-hidden="true"
        >
          {team.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2 
          id={`team-${team.id}-name`} 
          className="text-base sm:text-lg font-medium text-gray-900 truncate"
        >
          {team.name}
          {isCurrentTeam && (
            <span className="sr-only"> (current team on the clock)</span>
          )}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">
          <span>{picksCount} {picksCount === 1 ? 'pick' : 'picks'}</span>
          <span aria-hidden="true"> • </span>
          <span className="whitespace-normal">{needs.join(', ')}</span>
        </p>
      </div>
    </div>
  </div>
);

export default TeamHeader;
