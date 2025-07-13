import { supabase } from '../lib/supabase';

// Helper type to extract the row type from a table
type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

// Define your database schema types
type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          name: string;
          position: string | null;
          team: string | null;
          available: boolean;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
          event_id: string | null;
        };
      };
      draft_picks: {
        Row: {
          id: number;
          event_id: string | null;
          team_id: string | null;
          pick: number;
          round: number;
          player: string;
          player_position: string | null;
          notes: string | null;
          traded: boolean;
          created_at: string;
          created_by: string | null;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
          event_id: string | null;
        };
      };
    };
  };
};

type PlayerRow = TableRow<'players'>;
type DraftPickRow = TableRow<'draft_picks'> & {
  team?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
};

// Application types
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

export type Player = Omit<PlayerRow, 'updated_at'> & {
  updated_at?: string;
};

export type DraftPick = Omit<DraftPickRow, 'created_at' | 'updated_at'> & {
  created_at: string;
  updated_at?: string;
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
    
    if (error) {
      handleApiError(error, 'fetching players');
      return [];
    }
    
    return (data as PlayerRow[]).map(player => ({
      ...player,
      updated_at: player.updated_at
    }));
  },

  getAvailable: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('available', true)
      .order('name');
    
    if (error) {
      handleApiError(error, 'fetching available players');
      return [];
    }
    
    return (data as PlayerRow[]).map(player => ({
      ...player,
      updated_at: player.updated_at
    }));
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
      
      // Get the player's data with proper typing
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single<PlayerRow>();
      
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
          player_position: player.position, // Add the player's position
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
    
    return (data as DraftPickRow[]).map(pick => ({
      ...pick,
      created_at: pick.created_at,
      updated_at: pick.updated_at
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
    
    return (data as DraftPickRow[]).map(pick => ({
      ...pick,
      created_at: pick.created_at,
      updated_at: pick.updated_at
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
        player_position: null, // Reset player_position to null
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
