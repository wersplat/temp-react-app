import type { Team as TeamType, Player, DraftPick } from '../../services/supabase';
import type { UseQueryResult } from '@tanstack/react-query';

export type Team = TeamType;

export interface DraftContextType {
  // Original context values
  teams: Team[];
  players: Player[];  // All players
  availablePlayers: Player[]; // Undrafted players
  draftedPlayers: Array<Player & { team_id: string; team_name: string; pick_number?: number }>;
  draftPicks: DraftPick[];
  currentPick: number;
  isPaused: boolean;
  timeLeft: number;
  isLoading: boolean;
  
  // From useDraft hook
  teamsQuery: UseQueryResult<Team[], Error>;
  playersQuery: UseQueryResult<Player[], Error>;
  draftPicksQuery: UseQueryResult<DraftPick[], Error>;
  
  // Methods
  selectPlayer: (playerId: string) => Promise<void>;
  skipPick: () => void;
  togglePause: () => void;
  resetDraft: () => Promise<void>;
  setupRealtimeSubscriptions: (callbacks: {
    onPick: (pick: { pick_number: number }) => void;
    onPause: (paused: boolean) => void;
    onReset: () => void;
  }) => () => void;
}
