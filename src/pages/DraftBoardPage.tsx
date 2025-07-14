import { useDraft } from '../context/DraftContext/useDraft';
import { formatTime } from '../utils/formatTime';
import { getPositionAbbreviation } from '../utils/playerUtils';
import { useMemo } from 'react';

export default function DraftBoardPage() {
  const { 
    draftPicks, 
    teams, 
    currentPick, 
    isPaused, 
    timeLeft, 
    playersQuery,
    togglePause,
    resetDraft
  } = useDraft();

  // Get the current team on the clock
  const currentTeam = useMemo(() => {
    if (!teams.length) return null;
    return teams[(currentPick - 1) % teams.length];
  }, [teams, currentPick]);

  // Get the most recent picks (last 5)
  const recentPicks = useMemo(() => {
    return [...draftPicks]
      .sort((a, b) => b.pick - a.pick)
      .slice(0, 5)
      .map(pick => ({
        ...pick,
        team: teams.find(t => t.id === pick.team_id)
      }));
  }, [draftPicks, teams]);

  // Get upcoming picks (next 5)
  const upcomingPicks = useMemo(() => {
    const upcoming = [];
    const totalTeams = teams.length;
    
    if (totalTeams === 0) return [];
    
    for (let i = 0; i < 5; i++) {
      const pickNumber = currentPick + i;
      const round = Math.ceil(pickNumber / totalTeams);
      const teamIndex = (pickNumber - 1) % totalTeams;
      const team = teams[teamIndex];
      
      if (team) {
        upcoming.push({
          pick: pickNumber,
          round,
          team
        });
      }
    }
    
    return upcoming;
  }, [currentPick, teams]);

  if (playersQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Draft Board</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track the draft in real-time as teams make their selections
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            onClick={togglePause}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isPaused ? 'Resume Draft' : 'Pause Draft'}
          </button>
          <button
            type="button"
            onClick={resetDraft}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Draft
          </button>
        </div>
      </div>

      {/* Current Pick */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 bg-blue-50">
          <h2 className="text-lg font-medium text-blue-800">
            {isPaused ? 'Draft Paused' : 'Current Pick'}
          </h2>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {currentTeam ? (
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">#{currentPick}</div>
              <div className="text-2xl font-medium text-gray-900">{currentTeam.name}</div>
              <div className="mt-4 text-sm text-gray-500">
                {!isPaused && (
                  <span>Time remaining: {formatTime(timeLeft)}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No teams available</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Picks */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Picks</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {recentPicks.length > 0 ? (
                recentPicks.map((pick) => (
                  <li key={pick.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          #{pick.pick} - {pick.team?.name}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <div className="text-sm font-medium text-gray-900">
                          {typeof pick.player === 'string' ? pick.player : pick.player?.name}
                        </div>
                        {pick.player && typeof pick.player !== 'string' && pick.player.position && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getPositionAbbreviation(pick.player.position)}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No picks made yet
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Upcoming Picks */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Picks</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {upcomingPicks.length > 0 ? (
                upcomingPicks.map((pick, index) => (
                  <li key={index} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        #{pick.pick} - {pick.team.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Round {pick.round}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No upcoming picks available
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
