import { useDraft } from '../context/DraftContext/useDraft';
import { useApp } from '../context/AppContext';
import { eventsApi } from '../services/events';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

export default function TeamsPage() {
  const { teams, draftPicks, isLoading } = useDraft();
  const { currentEventId } = useApp();

  // Fetch current event to get picksPerTeam
  const { data: currentEvent } = useQuery({
    queryKey: ['currentEvent', currentEventId],
    queryFn: () => currentEventId ? eventsApi.getById(currentEventId) : null,
    enabled: !!currentEventId,
  });

  // Get total allowed picks per team from event settings (default to 15 if not available)
  const picksPerTeam = currentEvent?.picksPerTeam || 15;

  // Count picks per team
  const teamPicksCount = teams.reduce<Record<string, number>>((acc, team) => {
    acc[team.id] = draftPicks.filter(pick => pick.team_id === team.id).length;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No teams found</h3>
            <p className="mt-1 text-sm text-gray-500">There are no teams in this draft yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-500">View all teams participating in the draft</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const picksMade = teamPicksCount[team.id] || 0;
            const picksRemaining = Math.max(0, picksPerTeam - picksMade);
            
            return (
              <Link 
                key={team.id} 
                to={`/teams/${team.id}`}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    {team.logo_url ? (
                      <img 
                        className="h-12 w-12 rounded-full bg-gray-100"
                        src={team.logo_url} 
                        alt={`${team.name} logo`} 
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-500">{picksMade} of {picksPerTeam} picks made</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{picksMade}/{picksPerTeam}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(picksMade / picksPerTeam) * 100}%` }}
                      ></div>
                    </div>
                    <p className={`mt-2 text-sm font-medium ${
                      picksRemaining === 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {picksRemaining === 0 
                        ? 'Draft complete!' 
                        : `${picksRemaining} pick${picksRemaining !== 1 ? 's' : ''} remaining`}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
