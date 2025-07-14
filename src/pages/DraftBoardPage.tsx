import React from 'react';
import { useDraft } from '../context/DraftContext/useDraft';
import { useApp } from '../context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../services/events';
import type { Team, Player, PlayerPosition } from '../services/supabase';

// Define the DraftPick interface based on the database schema
interface DraftPick {
  id: number;
  event_id: string | null;
  team_id: string | null;
  player: string | Player;
  player_id?: string | null;
  pick: number;
  pick_number: number;
  round: number;
  player_position: PlayerPosition | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  traded: boolean;
  notes: string | null;
  team?: Team;
}

interface UpcomingPick {
  teamId: string;
  teamName: string;
  teamLogo?: string | null;
  pickNumber: number;
  round: number;
}

interface TeamWithPicks extends Team {
  upcomingPicks: UpcomingPick[];
  picksMade: number;
}

// Helper function to get player name from player data that could be string or Player object
const getPlayerName = (player: string | Player): string => {
  if (!player) return '';
  return typeof player === 'string' ? player : player.name;
};

// Helper function to get player position from player data that could be string or Player object
const getPlayerPosition = (player: string | Player, position: PlayerPosition | null): string => {
  if (position) return position;
  if (typeof player === 'object' && player.position) return player.position;
  return '';
};

export default function DraftBoardPage() {
  const { currentEventId } = useApp();
  const { 
    draftPicks, 
    teams, 
    currentPick, 
    playersQuery,
    isLoading: isDraftLoading 
  } = useDraft();

  // Fetch current event to get picks per team
  const { data: currentEvent } = useQuery({
    queryKey: ['currentEvent', currentEventId],
    queryFn: () => currentEventId ? eventsApi.getById(currentEventId) : null,
    enabled: !!currentEventId,
  });

  const picksPerTeam = currentEvent?.picksPerTeam || 15;
  const totalPicks = teams.length * picksPerTeam;

  // Calculate current team on the clock
  const currentTeamOnClock = React.useMemo(() => {
    if (!currentPick || !teams.length) return null;
    
    // Handle case where currentPick is just a number (pick index)
    if (typeof currentPick === 'number') {
      const teamIndex = (currentPick - 1) % teams.length;
      const team = teams[teamIndex];
      if (!team) return null;
      
      return {
        ...team,
        pickNumber: currentPick,
        round: Math.ceil(currentPick / teams.length)
      };
    }
    
    // Handle case where currentPick is a full pick object
    const pick = currentPick as DraftPick;
    const currentTeam = teams.find(team => team.id === pick.team_id);
    if (!currentTeam) return null;

    return {
      ...currentTeam,
      pickNumber: pick.pick_number || 0,
      round: pick.round || 0
    };
  }, [currentPick, teams]);

  // Calculate recent picks (last 5)
  const recentPicks = React.useMemo(() => {
    if (!draftPicks.length) return [];
    
    const picksWithTeams = (draftPicks as DraftPick[])
      .filter((pick): pick is DraftPick => !!pick.team_id && !!pick.player)
      .sort((a, b) => (b.pick_number || 0) - (a.pick_number || 0))
      .slice(0, 5);

    return picksWithTeams.map(pick => {
      const team = teams.find(t => t.id === pick.team_id);
      return {
        ...pick,
        teamName: team?.name || 'Unknown Team',
        teamLogo: team?.logo_url,
        playerName: getPlayerName(pick.player),
        playerPosition: getPlayerPosition(pick.player, pick.player_position)
      };
    });
  }, [draftPicks, teams]);

  // Calculate upcoming picks by team
  const upcomingPicksByTeam = React.useMemo(() => {
    if (!teams.length || !currentPick) return [];

    // Create a map of team IDs to their picks
    const teamPicksMap = new Map<string, TeamWithPicks>();
    
    // Initialize each team with empty upcoming picks array and 0 picks made
    teams.forEach(team => {
      teamPicksMap.set(team.id, {
        ...team,
        upcomingPicks: [],
        picksMade: 0
      });
    });

    // Count picks made by each team
    draftPicks.forEach(pick => {
      if (!pick.team_id) return;
      const team = teamPicksMap.get(pick.team_id);
      if (team) {
        team.picksMade++;
      }
    });

    // Find the next 10 upcoming picks
    const upcomingPicks: UpcomingPick[] = [];
    const currentPickNumber = typeof currentPick === 'number' 
      ? currentPick 
      : (currentPick as DraftPick)?.pick_number || 1; // Default to 1 if no current pick
    let nextPick = currentPickNumber + 1;
    
    while (upcomingPicks.length < 10 && nextPick <= totalPicks) {
      // Calculate round and pick number within the round
      const round = Math.ceil(nextPick / teams.length);
      const pickInRound = nextPick - ((round - 1) * teams.length);
      
      // For odd rounds, go in normal order (0, 1, 2, ...)
      // For even rounds, go in reverse order (..., 2, 1, 0)
      const teamIndex = round % 2 === 1 
        ? pickInRound - 1  // 0-based index for odd rounds
        : teams.length - pickInRound;  // Reverse order for even rounds
      
      // Ensure teamIndex is within bounds (should always be, but good to be safe)
      if (teamIndex >= 0 && teamIndex < teams.length) {
        const team = teams[teamIndex];
        upcomingPicks.push({
          teamId: team.id,
          teamName: team.name,
          teamLogo: team.logo_url,
          pickNumber: nextPick,
          round
        });
      }
      
      nextPick++;
    }

    // Group upcoming picks by team
    upcomingPicks.forEach(pick => {
      const team = teamPicksMap.get(pick.teamId);
      if (team) {
        team.upcomingPicks.push(pick);
      }
    });

    // Filter out teams with no upcoming picks and sort by picks made (ascending)
    return Array.from(teamPicksMap.values())
      .filter(team => team.upcomingPicks.length > 0)
      .sort((a, b) => a.picksMade - b.picksMade);
  }, [teams, currentPick, draftPicks, totalPicks]);

  if (isDraftLoading || playersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-medium">Loading draft data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Current Pick Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Current Pick</h2>
        {currentTeamOnClock ? (
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {currentTeamOnClock.logo_url ? (
                <img 
                  src={currentTeamOnClock.logo_url} 
                  alt={`${currentTeamOnClock.name} logo`} 
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold">
                  {currentTeamOnClock.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{currentTeamOnClock.name} is on the clock</h3>
              <p className="text-gray-600">
                Pick #{currentTeamOnClock.pickNumber} • Round {currentTeamOnClock.round}
              </p>
            </div>
          </div>
        ) : (
          <p>No current pick information available</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Picks */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Picks</h2>
          {recentPicks.length > 0 ? (
            <div className="space-y-4">
              {recentPicks.map((pick, index) => (
                <div key={`recent-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="font-medium">{pick.playerName}</div>
                    <span className="text-sm text-gray-500">{pick.playerPosition}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Pick #{pick.pick_number}</span>
                    {pick.teamLogo ? (
                      <img 
                        src={pick.teamLogo} 
                        alt="" 
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <span className="text-xs font-medium bg-gray-200 rounded-full px-2 py-1">
                        {pick.teamName.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent picks to display</p>
          )}
        </div>

        {/* Upcoming Picks */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Picks</h2>
          {upcomingPicksByTeam.length > 0 ? (
            <div className="space-y-6">
              {upcomingPicksByTeam.map(team => (
                <div key={team.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt="" 
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <h3 className="font-medium">{team.name}</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      {team.picksMade}/{picksPerTeam} picks made
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {team.upcomingPicks.map(pick => (
                      <div 
                        key={pick.pickNumber}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                        title={`Round ${pick.round}, Pick ${pick.pickNumber}`}
                      >
                        #{pick.pickNumber} (R{pick.round})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No upcoming picks to display</p>
          )}
        </div>
      </div>
    </div>
  );
}
