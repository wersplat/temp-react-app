import { supabase } from '../lib/supabase';

// Define your database schema types
// Define the player position types to match the database
// These should match the values in your database enum
export type DbPlayerPosition = 
  | 'Point Guard' 
  | 'Shooting Guard' 
  | 'Small Forward' 
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

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          "gt_psn": string;
          position: DbPlayerPosition | null;
          created_at: string;
          updated_at: string | null;
          event_id: string | null;
          team_name?: string | null;
          team_logo?: string | null;
        };
        Insert: Omit<PlayerRow, 'id' | 'created_at'>;
        Update: Partial<Omit<PlayerRow, 'id' | 'created_at'>>;
      };
      draft_picks: {
        Row: {
          id: number;
          event_id: string | null;
          team_id: string | null;
          pick: number;
          pick_number: number;
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
          "gt_psn": string;
          logo_url: string | null;
          created_at: string;
          updated_at: string | null;
          event_id: string | null;
          slug?: string;
        };
      };
      events: {
        Row: Omit<DbEvent, 'created_by'> & { created_by: string | null };
        Insert: Omit<DbEvent, 'id' | 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Omit<DbEvent, 'id' | 'created_at'>> & {
          updated_at?: string | null;
        };
      };
    };
  };
};

type PlayerRow = {
  id: string;
  "gt_psn": string;
  position: DbPlayerPosition | null;
  created_at: string;
  updated_at: string | null;
  event_id: string | null;
  team_name?: string | null;
  team_logo?: string | null;
};

// Player related types
export interface Player {
  id: string;
  "gt_psn": string;
  position: PlayerPosition | null;
  created_at: string;
  updated_at?: string | null;
  event_id?: string | null;
  team_name?: string | null;
  team_logo?: string | null;
}

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
  "gt_psn": string;
  logo_url: string | null;
  created_at: string;
  updated_at: string | null;
  draft_order?: number | null;
  event_id?: string | null;
  slug?: string | null;
};

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
    "gt_psn": string;
    logo_url: string | null;
    created_at: string;
    updated_at: string | null;
    event_id: string | null;
  } | null;
};

// Application representation of a draft pick with expanded relationships
// Base draft pick type that matches the database schema
interface DraftPickBase {
  id: number;
  event_id: string | null;
  team_id: string | null;
  player: string | Player;  // Can be just the ID or the full player object
  player_id?: string | null; 
  pick: number;
  pick_number: number; 
  round: number;
  player_position: PlayerPosition | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  traded: boolean;
  notes: string | null;
  team?: Team; 
}

export type DraftPick = DraftPickBase;

// Event related types
export interface Event {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  is_active?: boolean; // For backward compatibility
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  draftType: string;
  numTeams: number;
  pickTimeSeconds: number | null;
  picksPerTeam: number;
  prizePool: number | null;
  prizeBreakdown?: any; // Optional since it's not always needed
}

// Database representation of an event
export type DbEvent = {
  id: string;
  name: string;
  date: string | null;
  draft_type: string;
  num_teams: number;
  pick_time_seconds: number | null;
  picks_per_team: number;
  prize_breakdown: any;
  prize_pool: number | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string | null;
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
      .order('draft_order');
    
    if (error) handleApiError(error, 'fetching teams');
    return data || [];
  },

  getByEvent: async (eventId: string): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('event_id', eventId)
      .order('draft_order');
    
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

  create: async (
    name: string,
    eventId: string,
    logoUrl?: string | null
  ): Promise<Team | null> => {
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      throw new Error('You must be authenticated to create a team');
    }

    // Validate eventId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      console.error('Invalid event ID format:', eventId);
      throw new Error('Invalid event ID format. Please select a valid event.');
    }

    // First, verify the event exists and is active
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, is_active')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      if (eventError.code === 'PGRST116') { // No rows returned
        throw new Error('The selected event could not be found. It may have been deleted.');
      }
      throw new Error(`Error verifying event: ${eventError.message}`);
    }

    if (!event) {
      throw new Error(`Event with ID ${eventId} does not exist`);
    }

    // Check if the event is explicitly set to inactive
    const eventData = event as unknown as { id: string; is_active?: boolean };
    
    if (eventData.is_active === false) {
      throw new Error('Cannot create team for an inactive event. Please select an active event.');
    }

    // Check if a team with this name already exists for this event
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('gt_psn', name.trim())
      .eq('event_id', eventId)
      .single();

    if (existingTeam) {
      throw new Error(`A team with the name "${name}" already exists for this event`);
    }

    // Generate a base slug
    const baseSlug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens

    let uniqueSlug = baseSlug;
    let attempt = 1;
    let isUnique = false;

    // Keep trying with incrementing numbers until we find a unique slug
    while (!isUnique) {
      const { data: existingSlug, error: slugError } = await supabase
        .from('teams')
        .select('id')
        .eq('slug', uniqueSlug)
        .eq('event_id', eventId)
        .maybeSingle();

      if (slugError) {
        console.error('Error checking for existing slug:', slugError);
        break;
      }

      if (!existingSlug) {
        isUnique = true;
      } else {
        uniqueSlug = `${baseSlug}-${++attempt}`;
      }
    }

    const { data, error } = await supabase
      .from('teams')
      .insert({ 
        "gt_psn": name.trim(), 
        slug: uniqueSlug, 
        logo_url: logoUrl?.trim() || null, 
        event_id: eventId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating team:', error);
      throw new Error(`Failed to create team: ${error.message}`);
    }
    return data as Team;
  },
};

// Players API
export const playersApi = {
  getAll: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('gt_psn');
    
    if (error) {
      handleApiError(error, 'fetching players');
      return [];
    }
    
    return (data as PlayerRow[]).map(player => ({
      id: player.id,
      "gt_psn": player["gt_psn"],
      position: player.position,
      created_at: player.created_at,
      updated_at: player.updated_at,
      ...(player.team_name !== undefined && { team_name: player.team_name }),
      ...(player.team_logo !== undefined && { team_logo: player.team_logo }),
      ...(player.event_id !== undefined && { event_id: player.event_id })
    }));
  },

  getByEvent: async (eventId: string): Promise<Player[]> => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('event_id', eventId)
      .order('gt_psn');
    
    if (error) {
      console.error('Error fetching players by event:', error);
      return [];
    }
    
    return (data as PlayerRow[]).map(player => ({
      id: player.id,
      "gt_psn": player["gt_psn"],
      position: player.position,
      created_at: player.created_at,
      updated_at: player.updated_at,
      ...(player.team_name !== undefined && { team_name: player.team_name }),
      ...(player.team_logo !== undefined && { team_logo: player.team_logo }),
      ...(player.event_id !== undefined && { event_id: player.event_id })
    }));
  },

  search: async (query: string, eventId?: string): Promise<Player[]> => {
    let queryBuilder = supabase
      .from('players')
      .select('*')
      .ilike('gt_psn', `%${query}%`);

    if (eventId) {
      queryBuilder = queryBuilder.eq('event_id', eventId);
    }

    const { data, error } = await queryBuilder.order('gt_psn');

    if (error) {
      console.error('Error searching players:', error);
      return [];
    }

    return (data as PlayerRow[]).map(player => ({
      id: player.id,
      "gt_psn": player["gt_psn"],
      position: player.position,
      created_at: player.created_at,
      updated_at: player.updated_at,
      ...(player.team_name !== undefined && { team_name: player.team_name }),
      ...(player.team_logo !== undefined && { team_logo: player.team_logo }),
      ...(player.event_id !== undefined && { event_id: player.event_id })
    }));
  },

  create: async (
    name: string,
    position: PlayerPosition | null,
    eventId: string
  ): Promise<Player | null> => {
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      throw new Error('You must be authenticated to create a player');
    }

    const { data, error } = await supabase
      .from('players')
      .insert({ 
        "gt_psn": name, 
        position, 
        event_id: eventId 
      })
      .select('*')
      .single();

    if (error) {
      handleApiError(error, 'creating player');
      return null;
    }

    const playerData = data as PlayerRow;
    return {
      id: playerData.id,
      "gt_psn": playerData["gt_psn"],
      position: playerData.position,
      created_at: playerData.created_at,
      updated_at: playerData.updated_at,
      ...(playerData.team_name !== undefined && { team_name: playerData.team_name }),
      ...(playerData.team_logo !== undefined && { team_logo: playerData.team_logo }),
      ...(playerData.event_id !== undefined && { event_id: playerData.event_id })
    };
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
        player: player["gt_psn"], // Store the player's name directly
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
          .in('gt_psn', playerNames);
        
        if (players) {
          playerMap = new Map(players.map(p => [p["gt_psn"], p]));
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
        const playerName = player?.["gt_psn"] || pick.player;
        
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
          pick_number: pick.pick,
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
        .in('gt_psn', playerNames);

      // Create a map of player name to player for easy lookup
      const playerMap = new Map(players?.map(player => [player["gt_psn"], player]) || []);
      const now = new Date().toISOString();

      // Convert the database draft picks to our application format
      return (typedPicksData || []).map((pick): DraftPick => {
        const player = playerMap.get(pick.player);
        const playerName = player?.["gt_psn"] || pick.player;
        
        // Create the draft pick with all required fields
        const draftPick: DraftPick = {
          id: pick.id,
          event_id: pick.event_id,
          team_id: pick.team_id,
          player: playerName,
          player_id: player?.id || null,
          pick: pick.pick,
          pick_number: pick.pick,
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
          .in('gt_psn', playerNames);
        
        if (players) {
          playerMap = new Map(players.map(p => [p["gt_psn"], p]));
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
        const playerName = player?.gt_psn || (typeof pick.player === 'string' ? pick.player : '');
        
        // Create the draft pick with proper typing
        return {
          id: pick.id,
          event_id: pick.event_id,
          team_id: pick.team_id,
          player: playerName,
          player_id: player?.id || null,
          pick: pick.pick,
          pick_number: pick.pick,
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
      if (!pickData.event_id) {
        throw new Error('Event ID is required');
      }

      // Ensure we have a valid player position
      const playerPos = pickData.player_position ? 
        toPlayerPosition(pickData.player_position) : null;
        
      // Create a new object with only the fields that should be sent to the database
      const dbPick = {
        event_id: pickData.event_id,
        team_id: pickData.team_id || null,
        player: typeof pickData.player === 'string' ? pickData.player : pickData.player?.gt_psn || '',
        player_position: playerPos,
        pick: pickData.pick || 1, // Default to 1 if not provided
        round: pickData.round || Math.ceil((pickData.pick || 1) / 10), // Default to round 1 if not provided
        created_by: pickData.created_by || null, // Make created_by optional
        traded: pickData.traded || false,
        notes: pickData.notes || null
      };

      // First, check if a pick with the same event_id and pick already exists
      const { data: existingPick } = await supabase
        .from('draft_picks')
        .select('*')
        .eq('event_id', pickData.event_id)
        .eq('pick', pickData.pick || 1)
        .maybeSingle();

      let resultData;

      try {
        if (existingPick) {
          // Update existing pick
          const { data: updatedData, error: updateError } = await supabase
            .from('draft_picks')
            .update({
              ...dbPick,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPick.id)
            .select('*')
            .single();
          
          if (updateError) throw updateError;
          if (!updatedData) throw new Error('Failed to update draft pick');
          
          resultData = updatedData;
        } else {
          // Try to insert new pick
          const { data: insertedData, error: insertError } = await supabase
            .from('draft_picks')
            .insert(dbPick)
            .select('*')
            .single();
          
          if (insertError) {
            // If the error is about the created_by foreign key, try again without it
            if (insertError.code === '23503' && insertError.details?.includes('profiles')) {
              const { data: retryData, error: retryError } = await supabase
                .from('draft_picks')
                .insert({
                  ...dbPick,
                  created_by: null // Remove the created_by field
                })
                .select('*')
                .single();
              
              if (retryError) throw retryError;
              if (!retryData) throw new Error('Failed to create draft pick');
              
              resultData = retryData;
            } else {
              throw insertError;
            }
          } else {
            if (!insertedData) throw new Error('Failed to create draft pick');
            resultData = insertedData;
          }
        }
      } catch (error: any) {
        console.error('Error in draft pick operation:', error);
        if (error.code === '23505') {
          throw new Error('This pick has already been made. Please refresh the page to see the latest draft board.');
        }
        throw error;
      }

      // Get the team data if available
      let team: Team | undefined;
      if (resultData.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', resultData.team_id)
          .single();
        
        if (teamData) {
          team = teamData as Team;
        }
      }

      // Create the draft pick with all required fields
      const result: DraftPick = {
        id: resultData.id,
        event_id: resultData.event_id,
        team_id: resultData.team_id,
        player: typeof pickData.player === 'string' ? pickData.player : pickData.player?.gt_psn || '',
        player_id: typeof pickData.player === 'string' ? null : (pickData.player as any)?.id || null,
        pick: resultData.pick,
        pick_number: resultData.pick, // Map 'pick' to 'pick_number' for backward compatibility
        round: resultData.round || Math.ceil(resultData.pick / 10),
        player_position: playerPos,
        created_by: resultData.created_by || null,
        created_at: resultData.created_at || new Date().toISOString(),
        updated_at: (resultData as any).updated_at || new Date().toISOString(),
        traded: resultData.traded || false,
        notes: resultData.notes || null,
        team: team || undefined
      };
      
      return result;
    } catch (error) {
      console.error('Error in draftPicksApi.createDraftPick:', error);
      
      // Provide a more user-friendly error message
      if ((error as any).code === '23503' && (error as any).details?.includes('profiles')) {
        throw new Error('Unable to save draft pick due to user permission issues. Please try again or contact support.');
      }
      
      if ((error as any).code === '23505') {
        throw new Error('This pick has already been made. Please refresh the page to see the latest draft board.');
      }
      
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

// Events API
export const eventsApi = {
  create: async (
    name: string, 
    date: string | null = null, 
    isActive: boolean = true,
    draftType: string = 'snake',
    numTeams: number = 12,
    pickTimeSeconds: number | null = 60,
    picksPerTeam: number = 15,
    prizePool: number | null = null,
    createdBy: string | null = null
  ): Promise<Event | null> => {
    try {
      const isAuthenticated = await ensureAuth();
      if (!isAuthenticated) {
        throw new Error('You must be authenticated to create an event');
      }

      // Map to database schema
      const insertData = {
        name,
        date,
        draft_type: draftType,
        num_teams: numTeams,
        pick_time_seconds: pickTimeSeconds,
        picks_per_team: picksPerTeam,
        prize_breakdown: null,
        prize_pool: prizePool,
        is_active: isActive,
        created_by: createdBy
      };

      const { data, error } = await supabase
        .from('events')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return null;
      }

      // Map from database schema to Event interface
      const eventData = data as any; // We need to use any here due to type differences
      return {
        id: eventData.id,
        name: eventData.name,
        startDate: eventData.date,
        endDate: null,
        isActive: eventData.is_active ?? true,
        is_active: eventData.is_active ?? true,
        createdBy: eventData.created_by ?? null,
        createdAt: eventData.created_at,
        updatedAt: eventData.updated_at ?? null,
        draftType: eventData.draft_type || 'snake',
        numTeams: eventData.num_teams || 0,
        pickTimeSeconds: eventData.pick_time_seconds || 60,
        picksPerTeam: eventData.picks_per_team || 0,
        prizePool: eventData.prize_pool || null,
        prizeBreakdown: eventData.prize_breakdown
      };
    } catch (error) {
      console.error('Unexpected error in eventsApi.create:', error);
      throw error;
    }
  },

  getAll: async (): Promise<Event[]> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      // Use type assertion to handle the database response
      const events = (data || []) as Array<{
        id: string;
        name: string;
        date: string | null;
        draft_type: string;
        num_teams: number;
        pick_time_seconds: number | null;
        picks_per_team: number;
        prize_breakdown: any;
        prize_pool: number | null;
        is_active: boolean;
        created_by: string | null;
        created_at: string;
        updated_at: string | null;
      }>;

      return events.map(event => ({
        id: event.id,
        name: event.name,
        startDate: event.date,
        endDate: null,
        isActive: event.is_active ?? true,
        is_active: event.is_active ?? true,
        createdBy: event.created_by,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        draftType: event.draft_type || 'snake',
        numTeams: event.num_teams || 0,
        pickTimeSeconds: event.pick_time_seconds || 60,
        picksPerTeam: event.picks_per_team || 0,
        prizePool: event.prize_pool || null,
        prizeBreakdown: event.prize_breakdown
      }));
    } catch (error) {
      console.error('Unexpected error in eventsApi.getAll:', error);
      return [];
    }
  },
  // ... other event API methods
};
