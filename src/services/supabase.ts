import { supabase } from '../lib/supabase';

// Types
export type Team = {
  id: string;
  name: string;
  logo_url: string | null;  
  created_at: string;
  updated_at: string;
};

export type Player = {
  id: string;
  name: string;
  position: string;
  team: string | null;
  available: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DraftPick = {
  id: string;
  pick_number: number;
  team_id: string;
  team?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  player_id: string | null;
  player_name: string | null;
  player_position: string | null;
  created_at: string;
  updated_at: string;
};

// Helper function to handle API errors
const handleApiError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  const errorMessage = error.message || `Failed to ${context}`;
  throw new Error(errorMessage);
};

// Helper to ensure user is authenticated
const ensureAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated. Please sign in.');
  }
};

// Teams API
export const teamsApi = {
  getAll: async (): Promise<Team[]> => {
    await ensureAuth();
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    
    if (error) handleApiError(error, 'fetching teams');
    return data || [];
  },

  getById: async (id: string): Promise<Team | null> => {
    await ensureAuth();
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
    await ensureAuth();
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');
    
    if (error) handleApiError(error, 'fetching players');
    return data || [];
  },

  getAvailable: async (): Promise<Player[]> => {
    await ensureAuth();
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('available', true)
      .order('name');
    
    if (error) handleApiError(error, 'fetching available players');
    return data || [];
  },

  draftPlayer: async (playerId: string, teamId: string, pickNumber: number): Promise<void> => {
    await ensureAuth();
    try {
      // Get player details first
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();
      
      if (playerError || !player) {
        throw new Error('Player not found');
      }

      // Use the stored procedure for the transaction
      const { error: draftError } = await supabase.rpc('draft_player_transaction', {
        p_player_id: playerId,
        p_team_id: teamId,
        p_pick_number: pickNumber,
        p_player_name: player.name,
        p_player_position: player.position
      });

      if (draftError) throw draftError;
    } catch (error) {
      handleApiError(error, 'drafting player');
    }
  },
};

// Draft Picks API
export const draftPicksApi = {
  getAll: async (): Promise<DraftPick[]> => {
    await ensureAuth();
    const { data, error } = await supabase
      .from('draft_picks')
      .select(`
        *,
        teams (id, name, logo_url)
      `)
      .order('pick_number');
    
    if (error) handleApiError(error, 'fetching draft picks');
    return data || [];
  },

  getByTeam: async (teamId: string): Promise<DraftPick[]> => {
    await ensureAuth();
    const { data, error } = await supabase
      .from('draft_picks')
      .select(`
        *,
        teams (id, name, logo_url)
      `)
      .eq('team_id', teamId)
      .order('pick_number');
    
    if (error) handleApiError(error, 'fetching team draft picks');
    return data || [];
  },

  resetDraft: async (): Promise<void> => {
    await ensureAuth();
    const { error } = await supabase.rpc('reset_draft');
    if (error) handleApiError(error, 'resetting draft');
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
