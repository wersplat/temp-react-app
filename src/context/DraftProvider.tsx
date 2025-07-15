import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDraft as useDraftHook } from './DraftContext/useDraft';
import { DraftContext } from './DraftContext/context';
import type { ReactNode } from 'react';
import type { DraftContextType } from './DraftContext/types';
import type { Player as SupabasePlayer, DraftPick } from '../services/supabase';
import type { UseQueryResult } from '@tanstack/react-query';

export function DraftProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Use the useDraft hook to get draft data and actions
  const {
    teams = [],
    players = [],
    draftPicks = [],
    currentPick: draftCurrentPick = 1,
    isPaused: draftIsPaused = false,
    timeLeft: draftTimeLeft = 30,
    isLoading: draftIsLoading = false,
    selectPlayer: selectPlayerAction,
    skipPick: skipPickAction,
    togglePause: togglePauseAction,
    resetDraft: resetDraftAction,
    setupRealtimeSubscriptions,
  } = useDraftHook();

  // Local state for the draft
  const [currentPick, setCurrentPick] = useState<number>(draftCurrentPick);
  const [isPaused, setIsPaused] = useState<boolean>(draftIsPaused);
  const [timeLeft, setTimeLeft] = useState<number>(draftTimeLeft);
  
  // Use draftIsLoading directly from the hook
  const isLoading = draftIsLoading;

  // Create a mock query result that matches the expected shape
  const createMockQueryResult = useCallback(<T,>(data: T): UseQueryResult<T, Error> => {
    // Create the base result object with all required properties
    const result: UseQueryResult<T, Error> = {
      data,
      error: null,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isInitialLoading: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      fetchStatus: 'idle',
      failureReason: null,
      errorUpdateCount: 0,
      isLoadingError: false,
      isPending: false,
      refetch: async () => result,
      remove: () => {},
      // @ts-expect-error - This is a mock implementation
      promise: Promise.resolve(result)
    };

    return result;
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (setupRealtimeSubscriptions) {
      const cleanup = setupRealtimeSubscriptions({
        onPick: (pick: { pick_number: number }) => {
          setCurrentPick(pick.pick_number);
        },
        onPause: (paused: boolean) => {
          setIsPaused(paused);
        },
        onReset: () => {
          setCurrentPick(1);
          setIsPaused(false);
          setTimeLeft(30);
        },
      });

      return cleanup;
    }
  }, [setupRealtimeSubscriptions]);

  // Update local state when draft state changes
  useEffect(() => {
    setCurrentPick(draftCurrentPick);
    setIsPaused(draftIsPaused);
    setTimeLeft(draftTimeLeft);
  }, [draftCurrentPick, draftIsPaused, draftTimeLeft]);

  // Update time left in parent state if it changes locally
  useEffect(() => {
    if (timeLeft !== draftTimeLeft) {
      // Update parent state through the draft context
      // This will be handled by the parent component
    }
  }, [timeLeft, draftTimeLeft]);
  
  // Update pause state in parent if it changes locally
  useEffect(() => {
    if (isPaused !== draftIsPaused) {
      // Update parent state through the draft context
      // This will be handled by the parent component
    }
  }, [isPaused, draftIsPaused]);

  // Handle player selection
  const handleSelectPlayer = useCallback(async (playerId: string) => {
    if (!selectPlayerAction) {
      console.error('selectPlayerAction is not defined');
      return;
    }
    
    try {
      if (!teams || !teams.length) {
        throw new Error('No teams available');
      }
      
      const teamIndex = (currentPick - 1) % teams.length;
      const teamId = teams[teamIndex]?.id;
      
      if (!teamId) {
        throw new Error('Could not determine team for this pick');
      }
      
      await selectPlayerAction(playerId);
      
      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['draftPicks'] });
    } catch (error) {
      console.error('Error selecting player:', error);
      throw error;
    }
  }, [selectPlayerAction, currentPick, teams, queryClient]);

  // Handle skip pick
  const handleSkipPick = useCallback(() => {
    if (skipPickAction) {
      skipPickAction();
    } else {
      setCurrentPick(prev => prev + 1);
      setTimeLeft(90);
    }
  }, [skipPickAction]);

  // Handle toggle pause
  const handleTogglePause = useCallback(() => {
    if (togglePauseAction) {
      togglePauseAction();
    } else {
      setIsPaused(prev => !prev);
    }
  }, [togglePauseAction]);

  // Handle reset draft
  const handleResetDraft = useCallback(async () => {
    if (!resetDraftAction) {
      console.error('resetDraftAction is not defined');
      return;
    }
    
    try {
      await resetDraftAction();
      setCurrentPick(1);
      setTimeLeft(90);
      setIsPaused(false);
      
      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['draftPicks'] });
    } catch (error) {
      console.error('Error resetting draft:', error);
      throw error;
    }
  }, [resetDraftAction, queryClient]);

  // Calculate drafted players from draft picks
  const draftedPlayers = useMemo(() => {
    if (!draftPicks?.length || !players?.length || !teams?.length) return [];
    
    return draftPicks
      .filter((pick): pick is DraftPick & { player: string | { id: string } } => {
        if (!pick) return false;
        if (typeof pick.player === 'string' && pick.player) return true;
        if (pick.player && typeof pick.player === 'object' && 'id' in pick.player) return true;
        return false;
      })
      .map((pick) => {
        let player: SupabasePlayer | undefined;
        
        if (typeof pick.player === 'string') {
          player = players.find(p => p.name === pick.player);
        } else if (pick.player && typeof pick.player === 'object' && 'id' in pick.player) {
          const playerId = pick.player.id;
          player = players.find(p => p.id === playerId);
        }
        
        if (!player) return null;
        
        const team = teams.find(t => t.id === pick.team_id);
        
        return {
          ...player,
          team_id: pick.team_id || '', // Ensure team_id is not null
          team_name: team?.name || 'Unknown Team',
          pick_number: pick.pick
        };
      })
      .filter((p): p is SupabasePlayer & { 
        team_id: string; 
        team_name: string; 
        pick_number: number 
      } => p !== null && p.team_id !== null);
  }, [
    teams,
    players,
    draftPicks,
  ]);

  // Calculate available players (undrafted players)
  const availablePlayers = useMemo(() => {
    if (!players?.length) return [];
    if (!draftPicks?.length) return [...players];
    
    // Get the IDs of all drafted players, handling both string and object player references
    const draftedPlayerIds = draftPicks.map(pick => {
      if (typeof pick.player === 'string') {
        // If player is a string (name), find the player with that name
        const player = players.find(p => p.gt_psn === pick.player);
        return player?.id;
      }
      // If player is an object, use its ID
      return pick.player?.id;
    }).filter((id): id is string => !!id);
    
    // Filter out any players that have been drafted
    return players.filter(player => !draftedPlayerIds.includes(player.id));
  }, [players, draftPicks]);

  // Return the context value
  const contextValue: DraftContextType = {
    // Query data with proper typing
    teamsQuery: createMockQueryResult(teams || []),
    playersQuery: createMockQueryResult(players || []),
    draftPicksQuery: createMockQueryResult(draftPicks || []),
    
    // Data
    teams: Array.isArray(teams) ? teams : [],
    players: Array.isArray(players) ? players : [],
    availablePlayers: Array.isArray(availablePlayers) ? availablePlayers : [],
    draftPicks: Array.isArray(draftPicks) ? draftPicks : [],
    draftedPlayers: Array.isArray(draftedPlayers) ? draftedPlayers : [],
    
    // State
    currentPick,
    isPaused,
    timeLeft,
    isLoading,
    
    // Methods
    selectPlayer: handleSelectPlayer,
    skipPick: handleSkipPick,
    togglePause: handleTogglePause,
    resetDraft: handleResetDraft,
    setupRealtimeSubscriptions: setupRealtimeSubscriptions || (() => () => {}),
  };

  // Timer logic
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <DraftContext.Provider value={contextValue}>
      {children}
    </DraftContext.Provider>
  );
}
