import { supabase } from '../lib/supabase';

// Helper type to extract the row type from a table
type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

// Define your database schema types
// Define the player position types to match the database
// These should match the values in your database enum
type DbPlayerPosition = 
  | 'Point Guard' 
  | 'Shooting Guard' 
  | 'Lock' 
  | 'Power Forward' 
  | 'Center';

// Application player position type
export type PlayerPosition = DbPlayerPosition;

// Helper function to safely convert any string to PlayerPosition
export const toPlayerPosition = (pos: string | null | undefined): PlayerPosition | null => {
  if (!pos) return null;
  
  // Map any legacy positions to the new ones
  const positionMap: Record<string, PlayerPosition> = {
    'Lock': 'Lock',
    'Point Guard': 'Point Guard',
    'Shooting Guard': 'Shooting Guard',
    'Power Forward': 'Power Forward',
    'Center': 'Center'
  };
  
  const normalizedPos = pos.trim();
  
  // Check if it's a direct match
  if (['Point Guard', 'Shooting Guard', 'Lock', 'Power Forward', 'Center'].includes(normalizedPos)) {
    return normalizedPos as PlayerPosition;
  }
  
  // Check if it's a mapped position
  if (positionMap[normalizedPos]) {
    return positionMap[normalizedPos];
  }
  
  // Default to null if no match
  return null;
};

type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          name: string;
          position: PlayerPosition | null;
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
          player_position: PlayerPosition | null;
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
          slug?: string;
        };
      };
    };
  };
};

type PlayerRow = TableRow<'players'>;
// Export subscription functions
export const subscribeToDraftUpdates = (callback: () => void) => {
  return supabase
    .channel('draft_picks')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'draft_picks' },
      () => callback()
    )
    .subscribe();
};

export const subscribeToPlayerUpdates = (callback: () => void) => {
  return supabase
    .channel('players')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'players' },
      () => callback()
    )
    .subscribe();
};

// Application types
export type Team = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string | null;
  draft_order?: number | null;
  event_id?: string | null;
  slug?: string | null;
};

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition | null;
  updated_at?: string;
  team_name?: string | null;
  team_logo?: string | null;
  event_id?: string | null;
}

// Database representation of a draft pick
type DbDraftPick = {
  id: number;
  event_id: string | null;
  team_id: string | null;
  player: string;
  player_position: DbPlayerPosition | null;
  pick: number;
  round: number;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  traded: boolean;
  notes: string | null;
};

// Type for draft pick with team relation from Supabase
type DraftPickWithTeam = DbDraftPick & {
  team: {
    id: string;
    name: string;
    logo_url: string | null;
    created_at: string;
    updated_at: string | null;
    event_id: string | null;
  } | null;
};

// Application representation of a draft pick with expanded relationships
// Base draft pick type that matches the database schema
export interface DraftPickBase {
  id: number;
  event_id: string | null;
  team_id: string | null;
  player: string | Player;
  player_id?: string | null;  // Made optional with ?
  pick: number;
  round: number;
  player_position: PlayerPosition | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  traded: boolean;
  notes: string | null;
  team?: Team;
}

// Extended type for the application
export type DraftPick = DraftPickBase;

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

  getByEvent: async (eventId: string): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('event_id', eventId)
      .order('name');
    
    if (error) {
      console.error('Error fetching teams by event:', error);
      return [];
    }
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

  getByEvent: async (eventId: string): Promise<Player[]> => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('event_id', eventId)
      .order('name');
    
    if (error) {
      console.error('Error fetching players by event:', error);
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
      
      // Define the type for the update data
      type DraftPickUpdateData = {
        team_id: string;
        player: string;
        player_id: string;
        player_position: PlayerPosition | null;
        traded: boolean;
        updated_at: string;
      };

      // Update the draft pick with the player and team
      const updateData: DraftPickUpdateData = {
        team_id: teamId,
        player: player.name, // Store the player's name directly
        player_id: player.id, // Store the player's ID
        player_position: player.position, // Add the player's position
        traded: false,
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('draft_picks')
        .update(updateData)
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
    try {
      const { data: picksData } = await supabase
        .from('draft_picks')
        .select(`
          *,
          team:teams(*)
        `)
        .order('pick', { ascending: true });

      if (!picksData) return [];
      
      // Get unique player names to fetch player data
      const playerNames = picksData
        .map(pick => pick.player)
        .filter((name): name is string => Boolean(name));
      
      // Fetch all players in a single query if we have player names
      let playerMap = new Map<string, Player>();
      if (playerNames.length > 0) {
        const { data: players } = await supabase
          .from('players')
          .select('*')
          .in('name', playerNames);
        
        if (players) {
          playerMap = new Map(players.map(p => [p.name, p]));
        }
      }

      const now = new Date().toISOString();

      // Convert database rows to DraftPick objects
      return picksData.map(pick => {
        // Safely handle team data
        const teamData = pick.team ? {
          id: pick.team.id,
          name: pick.team.name,
          logo_url: pick.team.logo_url,
          created_at: pick.team.created_at,
          updated_at: pick.team.updated_at || now,
          event_id: pick.team.event_id
        } : undefined;

        // Get player data if available
        const player = playerMap.get(pick.player);
        const playerName = player?.name || pick.player;
        
        // Define the type for the database pick with optional updated_at
        type DatabasePick = typeof pick & { updated_at?: string };
        const dbPick = pick as DatabasePick;
        
        // Create the draft pick with all required fields
        const draftPick: DraftPick = {
          id: pick.id,
          event_id: pick.event_id,
          team_id: pick.team_id,
          player: playerName,
          player_id: player?.id || null,
          pick: pick.pick,
          round: pick.round || Math.ceil(pick.pick / 10),
          player_position: toPlayerPosition(pick.player_position),
          created_by: pick.created_by || 'system',
          created_at: pick.created_at || now,
          updated_at: dbPick.updated_at || now,
          traded: pick.traded || false,
          notes: pick.notes || null,
          team: teamData
        };
        
        return draftPick;
      });
    } catch (error) {
      console.error('Error in draftPicksApi.getAll:', error);
      return [];
    }
  },
  getByEvent: async (eventId: string): Promise<DraftPick[]> => {
    try {
      // First, get all draft picks for the event with team data
      const { data: picksData, error: picksError } = await supabase
        .from('draft_picks')
        .select(`
          *,
          team:teams!inner(id, name, logo_url, created_at, updated_at, event_id)
        `)
        .eq('event_id', eventId)
        .order('pick', { ascending: true });
        
      const typedPicksData = picksData as unknown as DraftPickWithTeam[] | null;

      if (picksError) {
        console.error('Error fetching draft picks by event:', picksError);
        return [];
      }

      if (!picksData || picksData.length === 0) {
        return [];
      }

      // Get all player names from the draft picks
      const playerNames = picksData.map(pick => pick.player).filter(Boolean) as string[];
      
      // Fetch all players in a single query
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .in('name', playerNames);

      // Create a map of player name to player for easy lookup
      const playerMap = new Map(players?.map(player => [player.name, player]) || []);
      const now = new Date().toISOString();

      // Convert the database draft picks to our application format
      return (typedPicksData || []).map((pick): DraftPick => {
        const player = playerMap.get(pick.player);
        const playerName = player?.name || pick.player;
        
        // Create the draft pick with all required fields
        const draftPick: DraftPick = {
          id: pick.id,
          event_id: pick.event_id,
          team_id: pick.team_id,
          player: playerName,
          player_id: player?.id || null,
          pick: pick.pick,
          round: pick.round || Math.ceil(pick.pick / 10),
          player_position: toPlayerPosition(pick.player_position),
          created_by: pick.created_by || 'system',
          created_at: pick.created_at || now,
          updated_at: pick.updated_at || now,
          traded: pick.traded || false,
          notes: pick.notes || null,
          team: pick.team ? {
            id: pick.team.id,
            name: pick.team.name,
            logo_url: pick.team.logo_url,
            created_at: pick.team.created_at,
            updated_at: pick.team.updated_at || now,
            event_id: pick.team.event_id
          } : undefined
        };
        
        return draftPick;
      });
    } catch (error) {
      console.error('Unexpected error in getByEvent:', error);
      return [];
    }
  },

  getByTeam: async (teamId: string): Promise<DraftPick[]> => {
    try {
      // First fetch draft picks for the team with team data
      const { data: picksData, error } = await supabase
        .from('draft_picks')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('team_id', teamId)
        .order('pick', { ascending: true });

      if (error) throw error;
      if (!picksData) return [];

      // Get unique player names to fetch player data
      const playerNames = picksData
        .map(pick => pick.player)
        .filter((name): name is string => Boolean(name));
      
      // Fetch all players in a single query if we have player names
      let playerMap = new Map<string, Player>();
      if (playerNames.length > 0) {
        const { data: players } = await supabase
          .from('players')
          .select('*')
          .in('name', playerNames);
        
        if (players) {
          playerMap = new Map(players.map(p => [p.name, p]));
        }
      }

      const now = new Date().toISOString();

      // Convert database rows to DraftPick objects
      return picksData.map(pick => {
        // Safely handle team data
        const teamData = pick.team ? {
          id: pick.team.id,
          name: pick.team.name,
          logo_url: pick.team.logo_url,
          created_at: pick.team.created_at,
          updated_at: pick.team.updated_at || now,
          event_id: pick.team.event_id
        } : undefined;

        // Get player data if available
        const player = typeof pick.player === 'string' ? playerMap.get(pick.player) : pick.player;
        const playerName = player?.name || (typeof pick.player === 'string' ? pick.player : '');
        
        // Create the draft pick with proper typing
        return {
          id: pick.id,
          event_id: pick.event_id,
          team_id: pick.team_id,
          player: playerName,
          player_id: player?.id || null,
          pick: pick.pick,
          round: pick.round || Math.ceil(pick.pick / 10), // Default round calculation if missing
          player_position: toPlayerPosition(pick.player_position),
          created_by: pick.created_by || 'system',
          created_at: pick.created_at || now,
          updated_at: (pick as any).updated_at || now,
          traded: pick.traded || false,
          notes: pick.notes || null,
          team: teamData
        } as DraftPick;
      });
    } catch (error) {
      console.error('Error in draftPicksApi.getByTeam:', error);
      return [];
    }
  },

  createDraftPick: async (pickData: Omit<DraftPick, 'id' | 'created_at' | 'updated_at'>): Promise<DraftPick> => {
    try {
      // Ensure we have a valid player position
      const playerPos = pickData.player_position ? 
        toPlayerPosition(pickData.player_position) : null;
        
      // Create a new object with only the fields that should be sent to the database
      const dbPick = {
        event_id: pickData.event_id,
        team_id: pickData.team_id,
        player: typeof pickData.player === 'string' ? pickData.player : pickData.player?.name || '',
        player_position: playerPos,
        pick: pickData.pick,
        round: pickData.round,
        created_by: pickData.created_by,
        traded: pickData.traded || false,
        notes: pickData.notes || null
      };

      const { data, error } = await supabase
        .from('draft_picks')
        .insert(dbPick)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      // Get the team data if available
      let team: Team | undefined;
      if (pickData.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', pickData.team_id)
          .single();
        if (teamData) {
          team = teamData as Team;
        }
      }

      // Create the draft pick with all required fields
      const result: DraftPick = {
        id: data.id,
        event_id: data.event_id,
        team_id: data.team_id,
        player: typeof pickData.player === 'string' ? pickData.player : pickData.player.name,
        player_id: typeof pickData.player === 'string' ? null : pickData.player.id,
        pick: data.pick,
        round: data.round || Math.ceil(data.pick / 10),
        player_position: playerPos,
        created_by: data.created_by || 'system',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: (data as any).updated_at || new Date().toISOString(),
        traded: data.traded || false,
        notes: data.notes || null,
        team: team || undefined
      };
      
      return result;
    } catch (error) {
      console.error('Error in draftPicksApi.createDraftPick:', error);
      throw error;
    }
  },

  resetDraft: async (): Promise<void> => {
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      throw new Error('You must be authenticated to reset the draft');
    }

    try {
      // Clear all draft picks by setting team_id to null and player to empty string
      const { error } = await supabase
        .from('draft_picks')
        .update({
          team_id: null,
          player: '',
          player_position: null,
          traded: false,
          notes: null
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error resetting draft:', error);
      throw error;
    }
  },

  subscribeToDraftUpdates: (callback: () => void) => {
    const subscription = supabase
      .channel('draft_picks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'draft_picks' },
        () => callback()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  subscribeToPlayerUpdates: (callback: () => void) => {
    const subscription = supabase
      .channel('players')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'players' },
        () => callback()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};
