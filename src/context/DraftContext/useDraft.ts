import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  teamsApi, 
  playersApi, 
  draftPicksApi, 
  type Team, 
  type Player, 
  type DraftPick
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

const DRAFT_DURATION = 60; // 60 seconds per pick

export const useDraft = (): DraftContextType => {
  const { user } = useAuth();
  const { currentEventId } = useApp();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State
  const [currentPick, setCurrentPick] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(DRAFT_DURATION);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fetch teams, players, and draft picks with event filtering
  const teamsQuery = useQuery<Team[]>({
    queryKey: ['teams', currentEventId],
    queryFn: () => currentEventId ? teamsApi.getByEvent(currentEventId) : Promise.resolve([]),
    enabled: !!currentEventId,
  });

  const playersQuery = useQuery<Player[]>({
    queryKey: ['players', currentEventId],
    queryFn: () => currentEventId ? playersApi.getByEvent(currentEventId) : Promise.resolve([]),
    enabled: !!currentEventId,
  });

  const draftPicksQuery = useQuery<DraftPick[]>({
    queryKey: ['draftPicks', currentEventId],
    queryFn: () => currentEventId ? draftPicksApi.getByEvent(currentEventId) : Promise.resolve([]),
    enabled: !!currentEventId,
  });

  // Extract data with default empty arrays
  const teams = teamsQuery.data || [];
  const players = playersQuery.data || [];
  const draftPicks = draftPicksQuery.data || [];
  
  // Memoize the current team based on the current pick
  const currentTeam = useMemo(() => {
    if (!teams.length) return null;
    return teams[(currentPick - 1) % teams.length];
  }, [teams, currentPick]);
  
  // Memoize drafted players
  const draftedPlayers = useMemo(() => {
    return draftPicks.map(pick => pick.player_id).filter(Boolean) as string[];
  }, [draftPicks]);
  
  // Memoize available players (not yet drafted)
  const availablePlayers = useMemo(() => {
    return players.filter(player => !draftedPlayers.includes(player.id));
  }, [players, draftedPlayers]);
  
  // Memoize team rosters
  const teamRosters = useMemo(() => {
    const rosters: Record<string, Player[]> = {};
    teams.forEach(team => {
      rosters[team.id] = draftPicks
        .filter(pick => pick.team_id === team.id)
        .map(pick => players.find(p => p.id === pick.player_id))
        .filter(Boolean) as Player[];
    });
    return rosters;
  }, [teams, draftPicks, players]);
  
  // Get the current round number
  const currentRound = useMemo(() => {
    return teams.length ? Math.ceil(currentPick / teams.length) : 1;
  }, [currentPick, teams.length]);
  
  // Get the current team's turn
  const currentTeamTurn = useMemo(() => {
    if (!teams.length) return null;
    return teams[(currentPick - 1) % teams.length];
  }, [teams, currentPick]);

  // Get drafted players with team info
  const draftedPlayersWithTeam = useMemo(() => {
    return draftPicks.map(pick => ({
      ...pick,
      team: teams.find(team => team.id === pick.team_id)
    }));
  }, [draftPicks, teams]);

  // Get undrafted players
  const availablePlayers = useMemo(() => {
    const draftedPlayerIds = new Set(draftPicks.map(pick => pick.player_id));
    return players.filter(player => !draftedPlayerIds.has(player.id));
  }, [players, draftPicks]);

  // Skip the current pick
  const skipPick = useCallback(() => {
    if (!currentEventId) {
      toast('No event selected', 'error');
      return;
    }
    setCurrentPick(prev => prev + 1);
    setTimeLeft(DRAFT_DURATION);
  }, [currentEventId, toast]);

  // Timer effect
  useEffect(() => {
    if (isPaused || isLoadingDraftPicks) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-skip if time runs out
          skipPick();
          return DRAFT_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isLoadingDraftPicks, skipPick]);

  // Show toast when draft is paused/resumed
  useEffect(() => {
    if (isLoadingDraftPicks) return;
    toast(isPaused ? 'Draft paused' : 'Draft resumed', 'info');
  }, [isPaused, isLoadingDraftPicks, toast]);

  // Show toast when pick is skipped
  useEffect(() => {
    if (isLoadingDraftPicks) return;
    if (timeLeft === DRAFT_DURATION) {
      toast('Pick skipped', 'info');
    }
  }, [timeLeft, isLoadingDraftPicks, toast]);

  // Get undrafted players (players not in draftPicks for this event)
  const undraftedPlayers = players.filter(player => 
    !draftPicks.some(pick => 
      typeof pick.player === 'object' ? 
        pick.player?.id === player.id : 
        pick.player === player.id
    )

  // Get drafted players with their team info
  const draftedPlayers = draftPicks
    .map(pick => {
      const player = players.find(p => p.id === pick.player_id);
      const team = teams.find(t => t.id === pick.team_id);
      return player && team ? {
        ...player,
        team_id: team.id,
        team_name: team.name,
        pick_number: pick.pick_number
      } : null;
    })
    .filter((p): p is Player & { team_id: string; team_name: string; pick_number: number } => p !== null);

  // Mutation for selecting a player
  const selectPlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      if (!currentEventId) {
        throw new Error('No event selected');
      }

      const currentTeam = teams[(currentPick - 1) % teams.length];
        event_id: currentEventId,
        team_id: teamId,
        player: playerId,
        player_id: playerId,
        pick: currentPick,
        pick_number: currentPick,
        round: Math.ceil(currentPick / teams.length),
        player_position: players.find(p => p.id === playerId)?.position || null,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        traded: false,
        notes: null,
      };

      await draftPicksApi.createDraftPick(newPick);
      
      // Invalidate and refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] }),
        queryClient.invalidateQueries({ queryKey: ['players', currentEventId] }),
      ]);
      
      // Move to next pick
      setCurrentPick(prev => prev + 1);
      setTimeLeft(DRAFT_DURATION);
      
      toast('Player drafted successfully', 'success');
    } catch (error) {
      console.error('Error creating draft pick:', error);
      toast('Failed to draft player', 'error');
    }
  }, [currentEventId, currentPick, players, queryClient, teams.length, toast, user?.id]);

  // Toggle pause state
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Pause/resume the draft
  const togglePauseDraft = useCallback(async () => {
    if (!currentEventId) {
      toast({
        title: 'Error',
        description: 'No event selected',
        status: 'error',
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('update_draft_state', {
        p_event_id: currentEventId,
        p_is_paused: !isPaused,
        p_current_pick: currentPick
      });

      if (error) throw error;

      setIsPaused(prev => !prev);
      toast({
        title: isPaused ? 'Draft Resumed' : 'Draft Paused',
        status: 'success',
      });
    } catch (error) {
      console.error('Error toggling draft pause state:', error);
      toast({
        title: 'Error',
        description: 'Failed to update draft state',
        status: 'error',
      });
    }
  }, [currentEventId, isPaused, currentPick, toast, setIsPaused]);

  // Set up real-time subscriptions for draft updates
  const setupRealtimeSubscriptions = useCallback(({
    onPick,
    onPause,
    onReset,
  }: {
    onPick?: (pick: { pick_number: number }) => void;
    onPause?: (paused: boolean) => void;
    onReset?: () => void;
  } = {}) => {
    if (!currentEventId) return () => {};

    // Subscribe to draft picks changes
    const picksChannel = supabase
      .channel('draft_picks_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'draft_picks',
          filter: `event_id=eq.${currentEventId}`,
        },
        (payload: any) => {
          const newPick = payload.new as { pick_number: number };
          onPick?.(newPick);
          queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] });
        }
      )
      .subscribe();

    // Subscribe to draft state changes (paused/resumed)
    const stateChannel = supabase
      .channel('draft_state_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'draft_state',
          filter: `event_id=eq.${currentEventId}`,
        },
        (payload: any) => {
          const state = payload.new as DraftState;
          if (typeof state.is_paused === 'boolean') {
            onPause?.(state.is_paused);
            setIsPaused(state.is_paused);
          }
          if (typeof state.current_pick === 'number') {
            setCurrentPick(state.current_pick);
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(picksChannel);
      supabase.removeChannel(stateChannel);
    };
  }, [currentEventId, queryClient]);

  // Initialize draft state on mount
  useEffect(() => {
    if (!currentEventId) return;
    
    // Fetch initial draft state
    const fetchDraftState = async () => {
      const { data, error } = await supabase
        .from('draft_state')
        .select('*')
        .eq('event_id', currentEventId)
        .single();
        
      if (data) {
        setIsPaused(data.is_paused);
        setCurrentPick(data.current_pick || 1);
      } else if (error && error.code !== 'PGRST116') { // Ignore not found error
        console.error('Error fetching draft state:', error);
      }
    };
    
    fetchDraftState();
  }, [currentEventId]);

  // Set up timer for draft picks
  useEffect(() => {
    if (isPaused || !currentEventId) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-skip if time runs out
          skipPick();
          return DRAFT_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, currentEventId, skipPick]);

  const skipPick = useCallback(() => {
    if (!currentEventId || !currentTeamTurn) return;

    // Increment the current pick
    setCurrentPick(prev => prev + 1);
    setTimeLeft(DRAFT_DURATION);

    // Update the draft state in the database
    supabase.rpc('update_draft_state', {
      p_event_id: currentEventId,
      p_is_paused: isPaused,
      p_current_pick: currentPick + 1,
    }).then(({ error }) => {
      if (error) {
        console.error('Error updating draft state:', error);
        toast({
          title: 'Error',
          description: 'Failed to update draft state',
          status: 'error',
        });
      } else {
        toast({
          title: 'Pick Skipped',
          description: `Team ${currentTeamTurn.name}'s pick was skipped`,
          status: 'info',
        });
      }
    });
  }, [
    currentEventId,
    currentTeamTurn,
    isPaused,
    currentPick,
    toast,
    setCurrentPick,
    setTimeLeft,
  ]);

  const resetDraft = useCallback(async () => {
    if (!currentEventId) return;

    const confirmed = window.confirm(
      'Are you sure you want to reset the draft? This will delete all draft picks and reset the draft state.'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.rpc('reset_draft', {
        p_event_id: currentEventId,
      });

      if (error) throw error;

      // Reset local state
      setCurrentPick(1);
      setIsPaused(true);
      setTimeLeft(DRAFT_DURATION);

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] });

      toast({
        title: 'Draft Reset',
        description: 'The draft has been reset successfully',
        status: 'success',
      });
    } catch (error) {
      console.error('Error resetting draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset draft',
        status: 'error',
      });
    }
  }, [
    currentEventId,
    queryClient,
    toast,
    setCurrentPick,
    setIsPaused,
    setTimeLeft,
  ]);

  return {
    // Query objects for React Query integration
    teamsQuery: null,
    playersQuery: null,
    draftPicksQuery: null,

    draftPicksQuery,
    
    // Draft state
    currentPick,
    currentRound,
    currentTeam: currentTeamTurn,
    timeLeft,
    isPaused,
    
    // Computed values
    draftedPlayers: draftedPlayersWithTeam,
    availablePlayers: undraftedPlayers,
    teamRosters,
    
    // Actions
    selectPlayer: selectPlayerMutation.mutateAsync,
    skipPick,
    togglePauseDraft,
    resetDraft,
    setupRealtimeSubscriptions,
    
    // Loading states
    isLoading: teamsQuery.isLoading || playersQuery.isLoading || draftPicksQuery.isLoading,
    isError: teamsQuery.isError || playersQuery.isError || draftPicksQuery.isError,
    error: teamsQuery.error || playersQuery.error || draftPicksQuery.error,
  };
};
