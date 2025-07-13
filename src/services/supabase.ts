import { supabase } from '../lib/supabase';

// Types
export type Team = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at?: string;
  draft_order?: number | null;
  event_id?: string | null;
  slug?: string | null;
};

export type Player = {
  id: string;
  name: string;
  position?: string;
  team?: string | null;
  available?: boolean;
  photo_url?: string | null;
  created_at: string;
  updated_at?: string;
  event_id?: string | null;
};

export type DraftPick = {
  id: number;
  event_id: string | null;
  team_id: string | null;
  pick: number;
  round: number;
  player: string;
  notes: string | null;
  traded: boolean;
  created_at: string;
  created_by: string | null;
  team?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
};

// Helper function to handle API errors
const handleApiError = (error: unknown, context: string): never => {
  console.error(`Error in ${context}:`, error);
  const errorMessage = error instanceof Error ? error.message : `Failed to ${context}`;
  throw new Error(errorMessage);
};

// Helper to ensure user is authenticated (for write operations)
const ensureAuth = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Teams API
export const teamsApi = {
  getAll: async (): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    
    if (error) handleApiError(error, 'fetching teams');
    return data || [];
  },

  getById: async (id: string): Promise<Team | null> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  },
};

// Players API
export const playersApi = {
  getAll: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');
    
    if (error) handleApiError(error, 'fetching players');
    return data || [];
  },

  getAvailable: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('available', true)
      .order('name');
    
    if (error) handleApiError(error, 'fetching available players');
    return data || [];
  },

  draftPlayer: async (playerId: string, teamId: string, pickNumber: number): Promise<void> => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      // First, find the draft pick with the matching pick number
      const { data: draftPick, error: findError } = await supabase
        .from('draft_picks')
        .select('*')
        .eq('pick', pickNumber)
        .single();
      
      if (findError) {
        handleApiError(findError, 'finding draft pick');
        return;
      }
      
      // Get the player's name
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('name')
        .eq('id', playerId)
        .single();
      
      if (playerError) {
        handleApiError(playerError, 'fetching player');
        return;
      }
      
      if (!player) {
        throw new Error(`Player with ID ${playerId} not found`);
      }
      
      // Update the draft pick with the player and team
      const { error: updateError } = await supabase
        .from('draft_picks')
        .update({
          team_id: teamId,
          player: player.name, // Store the player's name directly
          traded: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftPick.id);
      
      if (updateError) {
        handleApiError(updateError, 'updating draft pick');
      }
    } catch (error) {
      console.error('Error in draftPlayer:', error);
      throw error; // Re-throw to be handled by the caller
    }
  },
};

// Draft Picks API
export const draftPicksApi = {
  getAll: async (): Promise<DraftPick[]> => {
    const { data, error } = await supabase
      .from('draft_picks')
      .select(`
        *,
        team:teams!inner(id, name, logo_url)
      `);
    
    if (error) {
      handleApiError(error, 'fetching all draft picks');
      return [];
    }
    
    // Transform the data to match the DraftPick type
    return (data || []).map(pick => ({
      ...pick,
      // Ensure team is either the team object or undefined (not null)
      team: pick.team || undefined
    }));
  },

  getByTeam: async (teamId: string): Promise<DraftPick[]> => {
    const { data, error } = await supabase
      .from('draft_picks')
      .select(`
        *,
        team:teams!inner(id, name, logo_url)
      `)
      .eq('team_id', teamId);
    
    if (error) {
      handleApiError(error, 'fetching team draft picks');
      return [];
    }
    
    // Transform the data to match the DraftPick type
    return (data || []).map(pick => ({
      ...pick,
      // Ensure team is either the team object or undefined (not null)
      team: pick.team || undefined
    }));
  },

  resetDraft: async (): Promise<void> => {
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      throw new Error('You must be authenticated to reset the draft');
    }
    
    // Clear all draft picks by setting team_id to null and player to empty string
    const { error } = await supabase
      .from('draft_picks')
      .update({
        team_id: null,
        player: '',
        traded: false,
        notes: null
      });
      
    if (error) {
      handleApiError(error, 'resetting draft');
    }
  },
};

// Realtime subscriptions
export const subscribeToDraftUpdates = (callback: () => void) => {
  const channel = supabase
    .channel('draft-picks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'draft_picks',
      },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToPlayerUpdates = (callback: () => void) => {
  const channel = supabase
    .channel('players-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
      },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
