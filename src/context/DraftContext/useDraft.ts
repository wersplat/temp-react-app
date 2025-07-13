import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useEvent } from '../../context/EventContext';
import { 
  teamsApi, 
  playersApi, 
  draftPicksApi, 
  type Team, 
  type Player, 
  type DraftPick, 
  type PlayerPosition
} from '../../services/supabase';
import { useToast } from '../../hooks/useToast';
import type { DraftContextType } from './types';

const DRAFT_DURATION = 60; // 60 seconds per pick

export const useDraft = (): DraftContextType => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentEventId } = useEvent();
  const { user } = useAuth();
  
  // State for draft control
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DRAFT_DURATION);
  const [currentPick, setCurrentPick] = useState(1);
  
  // Fetch teams, players, and draft picks with event filtering
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['teams', currentEventId],
    queryFn: () => currentEventId ? teamsApi.getByEvent(currentEventId) : Promise.resolve([]),
    enabled: !!currentEventId,
  });

  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['players', currentEventId],
    queryFn: () => currentEventId ? playersApi.getByEvent(currentEventId) : Promise.resolve([]),
    enabled: !!currentEventId,
  });

  const { data: draftPicks = [], isLoading: isLoadingDraftPicks } = useQuery<DraftPick[]>({
    queryKey: ['draftPicks', currentEventId],
    queryFn: () => currentEventId ? draftPicksApi.getByEvent(currentEventId) : Promise.resolve([]),
    enabled: !!currentEventId,
  });

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
  );

  // Get drafted players with their team info
  const draftedPlayers = draftPicks
    .filter(pick => pick.player && pick.team_id)
    .map(pick => {
      const player = typeof pick.player === 'string' ? 
        players.find(p => p.id === pick.player) : 
        pick.player;
      
      if (!player) return null;
      
      return {
        ...player,
        team_id: pick.team_id as string,
        team_name: teams.find(t => t.id === pick.team_id)?.name || 'Unknown Team',
        pick_number: pick.pick
      };
    })
    .filter((player): player is Player & { team_id: string; team_name: string; pick_number: number } => player !== null);

  // Mutation for selecting a player
  const selectPlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      if (!currentEventId) {
        throw new Error('No event selected');
      }

      const currentTeam = teams[(currentPick - 1) % teams.length];
      if (!currentTeam) throw new Error('No team found for current pick');
      
      const player = players.find(p => p.id === playerId);
      if (!player) throw new Error('Player not found');
      
      // Create draft pick with all required fields
      // Convert player to string (name) for storage in the database
      const playerName = typeof player === 'string' ? player : player.name;
      const now = new Date().toISOString();
      
      // Create a new draft pick with all required fields
      const cleanPick = {
        event_id: currentEventId,
        team_id: currentTeam.id,
        player: playerName,
        player_id: playerId,
        pick: currentPick,
        round: Math.ceil(currentPick / teams.length),
        player_position: (typeof player === 'string' ? 'Flex' : player.position || 'Flex') as PlayerPosition,
        created_by: user?.id || 'system',
        created_at: now,
        traded: false,
        notes: null
      } as const;
      
      await draftPicksApi.createDraftPick(cleanPick);
      
      // Invalidate queries to refetch data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['players', currentEventId] }),
        queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] }),
      ]);
      
      // Move to next pick
      setCurrentPick(prev => prev + 1);
      setTimeLeft(DRAFT_DURATION);
    },
    onError: (error) => {
      console.error('Error selecting player:', error);
      toast('Failed to select player', 'error');
    },
  });

  // Toggle pause state
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Reset the draft
  const resetDraft = useCallback(async () => {
    try {
      await draftPicksApi.resetDraft();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['players'] }),
        queryClient.invalidateQueries({ queryKey: ['draftPicks'] }),
      ]);
      setCurrentPick(1);
      setTimeLeft(DRAFT_DURATION);
      setIsPaused(false);
      toast('Draft reset successfully', 'success');
    } catch (error) {
      console.error('Error resetting draft:', error);
      toast('Failed to reset draft', 'error');
    }
  }, [queryClient, toast]);

  return {
    teams,
    players: undraftedPlayers,
    draftedPlayers,
    draftPicks,
    currentPick,
    isPaused,
    timeLeft,
    isLoading: isLoadingTeams || isLoadingPlayers || isLoadingDraftPicks,
    selectPlayer: selectPlayerMutation.mutateAsync,
    skipPick,
    togglePause,
    resetDraft,
  };
};
