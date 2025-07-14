import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Team, Player, DraftPick, PlayerPosition } from '../services/supabase';
import { useApp } from '../context/AppContext';

// Define the draft pick input type for the upsert operation
type DraftPickInput = {
  pick: number;
  player: string;
  team_id: string | null;
  event_id: string | null;
  round: number;
  player_position: PlayerPosition | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  notes: string | null;
  traded: boolean;
  pick_number: number;
};

export interface UseDraftReturn {
  teamsQuery: {
    queryKey: (string | undefined)[];
    queryFn: () => Promise<Team[]>;
  };
  playersQuery: {
    queryKey: (string | undefined)[];
    queryFn: () => Promise<Player[]>;
  };
  draftPicksQuery: {
    queryKey: (string | undefined)[];
    queryFn: () => Promise<DraftPick[]>;
  };
  selectPlayer: (
    playerId: string, 
    currentPick: number, 
    teams: Team[],
    onSuccess?: () => void
  ) => Promise<void>;
  resetDraft: () => Promise<void>;
  setupRealtimeSubscriptions: () => () => void;
}

export function useDraft(): UseDraftReturn {
  const queryClient = useQueryClient();
  const { currentEventId } = useApp();

  // Fetch teams for the current event
  const teamsQuery = {
    queryKey: ['teams', currentEventId || undefined],
    queryFn: async (): Promise<Team[]> => {
      if (!currentEventId) return [];
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', currentEventId)
        .order('name');
      
      if (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }
      
      return data || [];
    },
  };

  // Fetch players for the current event
  const playersQuery = {
    queryKey: ['players', currentEventId || undefined],
    queryFn: async (): Promise<Player[]> => {
      if (!currentEventId) return [];
      
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('event_id', currentEventId)
        .order('name');
      
      if (error) {
        console.error('Error fetching players:', error);
        throw error;
      }
      
      // Ensure all Player objects have the required updated_at field
      return (data || []).map((player: Player & { updated_at?: string | null }) => ({
        ...player,
        updated_at: player.updated_at ?? null,
        created_at: player.created_at || new Date().toISOString()
      }));
    },
  };

  // Fetch draft picks for the current event
  const draftPicksQuery = {
    queryKey: ['draftPicks', currentEventId || undefined],
    queryFn: async (): Promise<DraftPick[]> => {
      if (!currentEventId) return [];
      
      const { data, error } = await supabase
        .from('draft_picks')
        .select('*')
        .eq('event_id', currentEventId)
        .order('pick', { ascending: true });
      
      if (error) {
        console.error('Error fetching draft picks:', error);
        throw error;
      }
      
      // Define the database row type for draft picks
      type DbDraftPickRow = {
        id: number;
        player: string;
        pick: number;
        round: number;
        team_id: string | null;
        event_id: string | null;
        player_position: PlayerPosition | null;
        created_by: string | null;
        created_at: string;
        updated_at?: string;
        notes?: string | null;
        traded?: boolean;
        pick_number?: number;
      };

      // Transform the data to match the DraftPick type
      return (data || []).map((pick: DbDraftPickRow) => {
        // Calculate pick_number if not present (for backward compatibility)
        const pickNumber = 'pick_number' in pick 
          ? (pick as { pick_number?: number }).pick_number ?? 0
          : (pick.round - 1) * 12 + pick.pick; // Assuming 12 teams per round
        
        // Transform to DraftPick type with all required fields
        const transformedPick: DraftPick = {
          id: pick.id,
          player: pick.player,
          pick: pick.pick,
          pick_number: pickNumber,
          round: pick.round,
          team_id: pick.team_id || null,
          event_id: pick.event_id || null,
          player_position: pick.player_position as PlayerPosition | null,
          created_by: pick.created_by || null,
          created_at: pick.created_at || new Date().toISOString(),
          updated_at: ('updated_at' in pick ? pick.updated_at : new Date().toISOString()) as string,
          notes: pick.notes || null,
          traded: pick.traded ?? false
        };
        
        return transformedPick;
      });
    },
  };

  // Mutation for selecting a player
  const { mutateAsync: selectPlayer } = useMutation({
    mutationFn: async ({ 
      playerId, 
      pickNumber, 
      teamId 
    }: { 
      playerId: string; 
      pickNumber: number; 
      teamId: string 
    }) => {
      const { error } = await supabase
        .from('draft_picks')
        .upsert({
          pick: pickNumber,
          player: playerId,
          team_id: teamId,
          event_id: currentEventId,
          round: 1, // Default round
          player_position: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          notes: null,
          traded: false,
          pick_number: pickNumber
        } as DraftPickInput);

      if (error) {
        console.error('Error selecting player:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] });
      queryClient.invalidateQueries({ queryKey: ['players', currentEventId] });
    },
  });

  // Mutation for resetting the draft
  const { mutateAsync: resetDraft } = useMutation({
    mutationFn: async () => {
      if (!currentEventId) return;
      
      // Delete all draft picks for the current event
      const { error } = await supabase
        .from('draft_picks')
        .delete()
        .eq('event_id', currentEventId);

      if (error) {
        console.error('Error resetting draft:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] });
      queryClient.invalidateQueries({ queryKey: ['players', currentEventId] });
    },
  });

  // Set up real-time subscriptions for draft picks
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!currentEventId) return () => {};
    
    const subscription = supabase
      .channel('draft_picks_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'draft_picks',
          filter: `event_id=eq.${currentEventId}`
        },
        () => {
          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['draftPicks', currentEventId] });
          queryClient.invalidateQueries({ queryKey: ['players', currentEventId] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentEventId, queryClient]);

  // Wrapper function for selecting a player
  const handleSelectPlayer = useCallback(
    async (playerId: string, currentPick: number, teams: Team[], onSuccess?: () => void) => {
      if (!currentEventId) {
        console.error('No event selected');
        return;
      }

      const teamIndex = Math.floor((currentPick - 1) % teams.length);
      const team = teams[teamIndex];

      if (!team) {
        console.error('No team found for pick', currentPick);
        return;
      }

      try {
        await selectPlayer({
          playerId,
          pickNumber: currentPick,
          teamId: team.id
        });
        onSuccess?.();
      } catch (error) {
        console.error('Error selecting player:', error);
      }
    },
    [selectPlayer, currentEventId]
  );

  return {
    teamsQuery,
    playersQuery,
    draftPicksQuery,
    selectPlayer: handleSelectPlayer,
    resetDraft,
    setupRealtimeSubscriptions,
  };
}
