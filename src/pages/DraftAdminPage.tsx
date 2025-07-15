import { useMemo } from 'react';
import { useDraft } from '../context/DraftContext/useDraft';
import { useApp } from '../context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../services/events';
import DraftPicksTable from '../components/DraftPicksTable';

const DraftAdminPage = () => {
  const { currentEventId } = useApp();
  const { data: currentEvent } = useQuery({
    queryKey: ['currentEvent', currentEventId],
    queryFn: () => (currentEventId ? eventsApi.getById(currentEventId) : null),
    enabled: !!currentEventId,
  });

  const {
    teams,
    draftPicks,
    currentPick,
    isPaused,
    togglePause,
    resetDraft,
  } = useDraft();

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
    <div className="space-y-8">
      <div className="flex space-x-4">
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          Start
        </button>
        <button
          onClick={togglePause}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={handleEnd}
          className="px-4 py-2 bg-red-600 text-white rounded-md"
        >
          End
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Upcoming Draft Order</h2>
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pick</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {upcomingPicks.map((p) => (
                <tr key={p.pick}>
                  <td className="px-4 py-2 whitespace-nowrap">#{p.pick}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{p.round}</td>
                  <td className="px-4 py-2 whitespace-nowrap flex items-center space-x-2">
                    {p.teamLogo ? (
                      <img src={p.teamLogo} alt="" className="h-5 w-5 rounded-full" />
                    ) : null}
                    <span>{p.teamName}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Past Picks</h2>
        <DraftPicksTable draftPicks={pastPicks} teams={teams} />
      </div>
    </div>
  );
};

export default DraftAdminPage;
