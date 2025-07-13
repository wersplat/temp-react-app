import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Team, Player, DraftPick } from '../services/supabase';

export interface UseDraftReturn {
  teamsQuery: {
    queryKey: string[];
    queryFn: () => Promise<Team[]>;
  };
  playersQuery: {
    queryKey: string[];
    queryFn: () => Promise<Player[]>;
  };
  draftPicksQuery: {
    queryKey: string[];
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

  // Fetch teams
  const teamsQuery = {
    queryKey: ['teams'],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }
      
      return data || [];
    },
  };

  // Fetch players
  const playersQuery = {
    queryKey: ['players'],
    queryFn: async (): Promise<Player[]> => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching players:', error);
        throw error;
      }
      
      return data || [];
    },
  };

  // Define the database draft pick type
  type DbDraftPick = {
    id: number;
    pick: number;
    round: number;
    player: string;
    team_id: string | null;
    event_id: string | null;
    player_position: 'Point Guard' | 'Shooting Guard' | 'Lock' | 'Power Forward' | 'Center' | null;
    notes: string | null;
    traded: boolean;
    created_at: string;
    updated_at: string | null;
    created_by: string | null;
  };

  // Fetch draft picks with all required fields
  const draftPicksQuery = {
    queryKey: ['draftPicks'],
    queryFn: async (): Promise<DraftPick[]> => {
      const { data, error } = await supabase
        .from('draft_picks')
        .select('*')
        .order('pick', { ascending: true });
      
      if (error) {
        console.error('Error fetching draft picks:', error);
        throw error;
      }
      
      const dbPicks = (data || []) as DbDraftPick[];
      
      // Map the data to ensure it matches the DraftPick type
      return dbPicks.map(pick => ({
        ...pick,
        // Ensure all required fields are present with defaults if needed
        updated_at: pick.updated_at || new Date().toISOString(),
        created_at: pick.created_at || new Date().toISOString(),
        player: pick.player || '',
        team_id: pick.team_id || null,
        event_id: pick.event_id || null,
        round: pick.round || 1,
        player_position: pick.player_position || null,
        notes: pick.notes || null,
        traded: pick.traded || false,
        created_by: pick.created_by || null
      }));
    },
  };

  // Select player mutation
  const { mutateAsync: selectPlayer } = useMutation({
    mutationFn: async (params: { playerId: string; pickNumber: number; teamId: string }) => {
      const { playerId, pickNumber, teamId } = params;
      
      const pickData = {
        pick: pickNumber,
        player: playerId,
        team_id: teamId,
        // Add required fields with default values
        round: 1, // Default round
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        event_id: null,
        notes: null,
        traded: false,
        player_position: null
      };
      
      const { data, error } = await supabase
        .from('draft_picks')
        .upsert(pickData, { onConflict: 'pick' })
        .select()
        .single();

      if (error) {
        console.error('Error selecting player:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['draftPicks'] });
    },
  });

  // Reset draft mutation
  const { mutateAsync: resetDraft } = useMutation({
    mutationFn: async () => {
      // Delete all draft picks
      const { error } = await supabase
        .from('draft_picks')
        .delete()
        .gte('pick', 1);

      if (error) {
        console.error('Error resetting draft:', error);
        throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['draftPicks'] });
    },
  });

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    const subscription = supabase
      .channel('draft_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'draft_picks' },
        () => {
          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['draftPicks'] });
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  };

  // Wrap selectPlayer to handle the team selection logic
  const handleSelectPlayer = useCallback(async (
    playerId: string, 
    currentPick: number, 
    teams: Team[],
    onSuccess?: () => void
  ) => {
    try {
      // Determine which team's turn it is
      const teamIndex = (currentPick - 1) % teams.length;
      const team = teams[teamIndex];
      
      if (!team) {
        throw new Error('No team found for the current pick');
      }
      
      await selectPlayer({
        playerId,
        pickNumber: currentPick,
        teamId: team.id,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error in handleSelectPlayer:', error);
      throw error;
    }
  }, [selectPlayer]);

  // Wrap resetDraft to match the expected return type
  const wrappedResetDraft = useCallback(async () => {
    await resetDraft();
  }, [resetDraft]);

  return {
    teamsQuery,
    playersQuery,
    draftPicksQuery,
    selectPlayer: handleSelectPlayer,
    resetDraft: wrappedResetDraft,
    setupRealtimeSubscriptions,
  };
}
