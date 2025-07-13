import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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

  // Extract data from queries
  const teams = teamsQuery.data || [];
  const players = playersQuery.data || [];
  const draftPicks = draftPicksQuery.data || [];


  // Compute derived data
  const draftedPlayers = useMemo(() => {
    if (!draftPicks?.length || !players?.length) return [];
    
    return players.filter(player => 
      draftPicks.some(pick => 
        (typeof pick.player === 'string' && pick.player === player.name) || 
        (typeof pick.player === 'object' && pick.player?.id === player.id)
      )
    );
  }, [draftPicks, players]);

  // Get undrafted players
  const availablePlayers = useMemo(() => {
    if (!players?.length) return [];
    
    return players.filter(player => 
      !draftedPlayers.some(dp => dp.id === player.id)
    );
  }, [players, draftedPlayers]);

  // Calculate team rosters
  /*
  // Team rosters calculation currently unused – can be re-enabled when needed
  const teamRosters = useMemo(() => {
    if (!teams?.length || !draftPicks?.length) return {};
    
    return teams.reduce<Record<string, Player[]>>((acc, team) => {
      acc[team.id] = draftedPlayers.filter(player => {
        const pick = draftPicks.find(p => 
          (typeof p.player === 'string' && p.player === player.name) || 
          (typeof p.player === 'object' && p.player?.id === player.id)
        );
        return pick?.team_id === team.id;
      });
      return acc;
    }, {});
  }, [teams, draftPicks, draftedPlayers]);
  */

  // Calculate current round based on current pick and number of teams
  const currentRound = useMemo(() => {
    if (!teams?.length || !currentPick) return 1;
    return Math.ceil(currentPick / teams.length);
  }, [currentPick, teams]);

  // Calculate which team's turn it is
  const currentTeamTurn = useMemo(() => {
    if (!teams?.length || !currentPick) return null;
    const pickInRound = ((currentPick - 1) % teams.length) + 1;
    return teams.find(team => team.draft_order === pickInRound) || null;
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
        setTimeLeft(DRAFT_DURATION);
        
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] });
        
        toast(`${player.name} was drafted by ${currentTeamTurn?.name}`, 'success');
        
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
      setTimeLeft(DRAFT_DURATION);
      
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
      setTimeLeft(DRAFT_DURATION);
      
      toast(`${currentTeamTurn?.name || 'Team'} skipped their pick`, 'info');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to skip pick', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId, isPaused, currentPick, currentTeamTurn, toast]);

  // Return the context value
  return {
    teams,
    players: availablePlayers,
    draftedPlayers: draftedPlayersWithTeam,
    draftPicks,
    currentPick,
    isPaused,
    timeLeft,
    isLoading,
    teamsQuery,
    playersQuery,
    draftPicksQuery,
    selectPlayer: (playerId: string) => draftPlayer.mutateAsync(playerId),
    skipPick,
    togglePause: togglePauseDraft,
    resetDraft,
    setupRealtimeSubscriptions
  };
};