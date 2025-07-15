// Common types used across the application

export type PlayerPosition = 'Point Guard' | 'Shooting Guard' | 'Small Forward' | 'Lock' | 'Power Forward' | 'Center';

export interface Event {
  id: string;
  name: string;
  date: string;
  num_teams: number;
  picks_per_team: number;
  pick_time_seconds: number;
  prize_pool: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  draft_type: 'snake' | 'linear';
  created_by: string | null;
}

export interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  event_id: string;
  draft_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  "GT/PSN": string;
  position: PlayerPosition;
  event_id: string;
  created_at: string;
  updated_at: string;
}

export interface DraftPick {
  id: string;
  pick_number: number;
  team_id: string;
  player_id: string | null;
  event_id: string;
  created_at: string;
  updated_at: string;
  team?: {
    name: string;
    logo_url: string | null;
  };
  player?: {
    "GT/PSN": string;
    position: PlayerPosition;
  } | null;
}

// Form data types
export interface EventFormData {
  name: string;
  date: string;
  numTeams: number;
  picksPerTeam: number;
  pickTimeSeconds: number;
  prizePool: string;
  draftType?: 'snake' | 'linear';
}

export interface PlayerFormData {
  "GT/PSN": string;
  position: PlayerPosition;
}

export interface TeamFormData {
  name: string;
  logoUrl: string | null;
  logoFile: File | null;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Draft status
export interface DraftStatus {
  currentPick: number;
  isPaused: boolean;
  isComplete: boolean;
  totalPicks: number;
}

// Draft pick with team and player info
export interface DraftPickWithDetails extends DraftPick {
  team: {
    name: string;
    logo_url: string | null;
  };
  player: {
    "GT/PSN": string;
    position: PlayerPosition;
  } | null;
}
