import React, { useMemo } from 'react';
import { useDraft } from '../context/DraftContext/useDraft';
import { useApp } from '../context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../services/events';
import DraftPicksTable from '../components/DraftPicksTable';

const DraftAdminPage = () => {
  const { currentEventId } = useApp();
  const {
    teams,
    draftPicks,
    currentPick,
    isPaused,
    togglePause,
    resetDraft,
  } = useDraft();

  const { data: currentEvent } = useQuery({
    queryKey: ['currentEvent', currentEventId],
    queryFn: () => (currentEventId ? eventsApi.getById(currentEventId) : null),
    enabled: !!currentEventId,
  });

  const picksPerTeam = currentEvent?.picksPerTeam || 15;
  const totalPicks = teams.length * picksPerTeam;

  const upcomingPicks = useMemo(() => {
    if (!teams.length) return [] as Array<{ pick: number; round: number; teamName: string; teamLogo?: string | null }>;
    const sortedTeams = [...teams].sort((a, b) => (a.draft_order || 0) - (b.draft_order || 0));
    const result: Array<{ pick: number; round: number; teamName: string; teamLogo?: string | null }> = [];
    let next = currentPick + 1;
    while (next <= totalPicks && result.length < 20) {
      const round = Math.ceil(next / sortedTeams.length);
      const pickInRound = ((next - 1) % sortedTeams.length) + 1;
      const index = round % 2 === 1 ? pickInRound - 1 : sortedTeams.length - pickInRound;
      const team = sortedTeams[index];
      result.push({ pick: next, round, teamName: team.name, teamLogo: team.logo_url });
      next += 1;
    }
    return result;
  }, [teams, currentPick, totalPicks]);

  const pastPicks = useMemo(() => {
    return draftPicks
      .slice()
      .sort((a, b) => (b.pick_number || b.pick) - (a.pick_number || a.pick));
  }, [draftPicks]);

  const handleStart = async () => {
    if (isPaused && currentPick === 1) {
      togglePause();
    } else if (isPaused) {
      togglePause();
    } else {
      await resetDraft();
      togglePause();
    }
  };

  const handleEnd = async () => {
    await resetDraft();
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {isPaused && currentPick === 1 ? 'Start Draft' : isPaused ? 'Resume' : 'Restart'}
        </button>
        <button
          onClick={togglePause}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={handleEnd}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          End Draft
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Upcoming Draft Order</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pick</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingPicks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">No upcoming picks</td>
                  </tr>
                ) : (
                  upcomingPicks.map((pick) => (
                    <tr key={pick.pick}>
                      <td className="px-4 py-2 whitespace-nowrap">#{pick.pick}</td>
                      <td className="px-4 py-2 whitespace-nowrap flex items-center space-x-2">
                        {pick.teamLogo ? (
                          <img src={pick.teamLogo} alt="" className="h-5 w-5 rounded-full" />
                        ) : null}
                        <span>{pick.teamName}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{pick.round}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Past Picks</h2>
          <DraftPicksTable draftPicks={pastPicks} teams={teams} />
        </div>
      </div>
    </div>
  );
};

export default DraftAdminPage;
