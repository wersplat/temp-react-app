import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  teamsApi, 
  playersApi, 
  draftPicksApi, 
  type Team, 
  type Player, 
  type DraftPick,
  eventsApi,
  type Event
} from '../../services/supabase';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import type { DraftContextType } from './types';

// Define the draft state type
interface DraftState {
  id?: string;
  is_paused: boolean;
  current_pick: number;
  event_id: string;
  updated_at?: string;
  created_at?: string;
}

export const useDraft = (): DraftContextType => {
  const { user } = useAuth();
  const { currentEventId } = useApp();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State
  const [currentPick, setCurrentPick] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(0); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fetch current event to get pick_time_seconds
  const { data: currentEvent } = useQuery<Event | null, Error>({
    queryKey: ['currentEvent', currentEventId],
    queryFn: () => currentEventId ? eventsApi.getById(currentEventId) : null,
    enabled: !!currentEventId,
  });

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Initialize timeLeft with pick_time_seconds when event changes
    if (currentEvent?.pickTimeSeconds) {
      setTimeLeft(currentEvent.pickTimeSeconds);
    }

    // Start timer if not paused and timeLeft > 0
    if (!isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev > 0) {
            return prev - 1;
          }
          return 0;
        });
      }, 1000);
    }

    // Reset timer when draft is paused
    if (isPaused) {
      if (currentEvent?.pickTimeSeconds) {
        setTimeLeft(currentEvent.pickTimeSeconds);
      }
    }

    // Reset timer when time runs out
    if (timeLeft === 0) {
      if (currentEvent?.pickTimeSeconds) {
        setTimeLeft(currentEvent.pickTimeSeconds);
      }
    }

    // Clean up timer
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPaused, timeLeft, currentEvent?.pickTimeSeconds]);

  // Fetch teams, players, and draft picks with event filtering
  const teamsQuery = useQuery<Team[], Error>({
    queryKey: ['teams', currentEventId],
    queryFn: () => currentEventId ? teamsApi.getByEvent(currentEventId) : Promise.resolve([]),
    enabled: !!currentEventId,
  });

  const playersQuery = useQuery<Player[], Error>({
    queryKey: ['players', currentEventId],
    queryFn: async () => {
      if (!currentEventId) return [];
      
      const data = await playersApi.getByEvent(currentEventId);
      
      // Ensure all Player objects have the required fields
      return data.map(player => ({
        ...player,
        updated_at: player.updated_at ?? null,
        created_at: player.created_at || new Date().toISOString(),
        position: player.position ?? null,
        event_id: player.event_id ?? currentEventId,
      }));
    },
    enabled: !!currentEventId,
  });

  const draftPicksQuery = useQuery<DraftPick[], Error>({
    queryKey: ['draftPicks', currentEventId],
    queryFn: () => currentEventId ? draftPicksApi.getByEvent(currentEventId) : Promise.resolve([]),
    enabled: !!currentEventId,
  });

  // Extract and memoize data from queries
  const teams = useMemo(() => teamsQuery.data || [], [teamsQuery.data]);
  const players = useMemo(() => playersQuery.data || [], [playersQuery.data]);
  const draftPicks = useMemo(() => draftPicksQuery.data || [], [draftPicksQuery.data]);


  // Get undrafted players
  const availablePlayers = useMemo(() => {
    if (!players?.length) return [];
    if (!draftPicks?.length) return [...players];
    
    // Get the IDs of all drafted players, handling both string and object player references
    const draftedPlayerIds = draftPicks.map(pick => {
      if (typeof pick.player === 'string') {
        // If player is a string (name), find the player with that name
        const player = players.find(p => p.name === pick.player);
        return player?.id;
      }
      // If player is an object, use its ID
      return pick.player?.id;
    }).filter((id): id is string => !!id);
    
    // Filter out any players that have been drafted
    return players.filter(player => !draftedPlayerIds.includes(player.id));
  }, [players, draftPicks]);

  // Calculate current round based on current pick and number of teams
  const currentRound = useMemo(() => {
    if (!teams?.length || !currentPick) return 1;
    return Math.ceil(currentPick / teams.length);
  }, [currentPick, teams]);

  // Calculate which team's turn it is
  const currentTeamTurn = useMemo(() => {
    if (!teams?.length || !currentPick) return null;
    
    // Calculate the round (1-based)
    const round = Math.ceil(currentPick / teams.length);
    // Calculate the pick within the current round (1-based)
    const pickInRound = ((currentPick - 1) % teams.length) + 1;
    
    // For odd rounds: 1, 2, 3, ...
    // For even rounds: ..., 3, 2, 1
    const teamIndex = round % 2 === 1 
      ? pickInRound - 1  // 0-based index for odd rounds
      : teams.length - pickInRound;  // Reverse order for even rounds
    
    // Ensure we have a valid team index
    if (teamIndex >= 0 && teamIndex < teams.length) {
      return teams[teamIndex];
    }
    return null;
  }, [currentPick, teams]);

  // Get drafted players with team info
  const draftedPlayersWithTeam = useMemo(() => {
    if (!draftPicks?.length || !players?.length || !teams?.length) return [];
    
    return draftPicks
      .filter(pick => pick.player && pick.team_id)
      .map(pick => {
        const player = typeof pick.player === 'string' 
          ? players.find(p => p.name === pick.player)
          : players.find(p => p.id === (pick.player as Player).id);
          
        const team = teams.find(t => t.id === pick.team_id);
        
        if (!player || !team) return null;
        
        return {
          ...player,
          team_id: pick.team_id || '',
          team_name: team.name,
          pick_number: pick.pick
        };
      })
      .filter((p): p is Player & { team_id: string; team_name: string; pick_number: number } => 
        p !== null
      );
  }, [draftPicks, players, teams]);

  // Draft a player
  const draftPlayer = useMutation<void, Error, string>({
    mutationFn: async (playerId: string) => {
      if (!currentEventId || !user) {
        throw new Error('Missing event ID or user');
      }
      
      setIsLoading(true);
      
      try {
        const player = players.find(p => p.id === playerId);
        if (!player) {
          throw new Error('Player not found');
        }
        
        const teamId = currentTeamTurn?.id;
        if (!teamId) {
          throw new Error('No team found for current pick');
        }
        
        // Create the draft pick
        const newPick: Omit<DraftPick, 'id' | 'created_at' | 'updated_at'> = {
          event_id: currentEventId,
          team_id: teamId,
          player: player,
          player_id: player.id,
          pick: currentPick,
          pick_number: currentPick,
          round: currentRound,
          player_position: player.position,
          created_by: user.id,
          traded: false,
          notes: null
        };
        
        // Save to database
        await draftPicksApi.createDraftPick(newPick);
        
        // Update draft state
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc('update_draft_state', {
          p_event_id: currentEventId,
          p_is_paused: isPaused,
          p_current_pick: currentPick + 1
        });
        
        // Update local state
        setCurrentPick(prev => prev + 1);
        setTimeLeft(currentEvent?.pickTimeSeconds ?? 0);
        
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] });
        
        toast(`${player.gt_psn} was drafted by ${currentTeamTurn?.name}`, 'success');
        
        return;
      } catch (error) {
        toast(error instanceof Error ? error.message : 'Failed to draft player', 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  });

  // Toggle pause draft
  const togglePauseDraft = useCallback(async () => {
    if (!currentEventId) return;
    
    try {
      setIsLoading(true);
      
      // Update draft state in database
      await (supabase as any).rpc('update_draft_state', {
        p_event_id: currentEventId,
        p_is_paused: !isPaused,
        p_current_pick: currentPick
      });
      
      // Update local state
      setIsPaused(prev => !prev);
      
      toast(isPaused ? 'Draft Resumed' : 'Draft Paused', 'info');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to toggle pause', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId, isPaused, currentPick, toast]);

  // Reset draft
  const resetDraft = useCallback(async () => {
    if (!currentEventId) return;
    
    try {
      setIsLoading(true);
      
      // Call reset_draft RPC function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('reset_draft', {
        p_event_id: currentEventId
      });
      
      // Update local state
      setCurrentPick(1);
      setIsPaused(true);
      setTimeLeft(currentEvent?.pickTimeSeconds ?? 0);
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] });
      
      toast('Draft reset successfully', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to reset draft', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId, queryClient, toast]);

  // Set up realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(({
    onPick,
    onPause,
    onReset
  }: {
    onPick?: (pick: { pick_number: number }) => void;
    onPause?: (isPaused: boolean) => void;
    onReset?: () => void;
  } = {}) => {
    if (!currentEventId) return () => {};
    
    // Subscribe to draft picks changes
    const picksChannel = supabase.channel('draft_picks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'draft_picks', filter: `event_id=eq.${currentEventId}` },
        (payload) => {
          onPick?.(payload.new as { pick_number: number });
          queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] });
        }
      )
      .subscribe();
    
    // Subscribe to draft state changes
    const stateChannel = supabase.channel('draft_state_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'draft_state', filter: `event_id=eq.${currentEventId}` },
        (payload) => {
          const newState = payload.new as DraftState;
          setIsPaused(newState.is_paused);
          setCurrentPick(newState.current_pick);
          
          if (newState.is_paused) {
            onPause?.(true);
          } else {
            onPause?.(false);
          }
          
          if (newState.current_pick === 1) {
            onReset?.();
          }
        }
      )
      .subscribe();
    
    // Return cleanup function
    return () => {
      supabase.removeChannel(picksChannel);
      supabase.removeChannel(stateChannel);
    };
  }, [currentEventId, queryClient]);

  // Skip pick
  const skipPick = useCallback(async () => {
    if (!currentEventId || isPaused) return;
    
    try {
      setIsLoading(true);
      
      // Update draft state in database
      await (supabase as any).rpc('update_draft_state', {
        p_event_id: currentEventId,
        p_is_paused: isPaused,
        p_current_pick: currentPick + 1
      });
      
      // Update local state
      setCurrentPick(prev => prev + 1);
      setTimeLeft(currentEvent?.pickTimeSeconds ?? 0);
      
      toast(`${currentTeamTurn?.name || 'Team'} skipped their pick`, 'info');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to skip pick', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId, isPaused, currentPick, currentTeamTurn, toast]);

  // Return the context value
  return {
    // State
    teams,
    players,
    availablePlayers,
    draftedPlayers: draftedPlayersWithTeam,
    draftPicks,
    currentPick,
    isPaused,
    timeLeft,
    isLoading,
    
    // Queries
    teamsQuery,
    playersQuery,
    draftPicksQuery,
    
    // Methods
    selectPlayer: (playerId: string) => draftPlayer.mutateAsync(playerId),
    skipPick,
    togglePause: togglePauseDraft,
    resetDraft,
    setupRealtimeSubscriptions,
  };
};