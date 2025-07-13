import type { Team as TeamType, Player, DraftPick } from '../../services/supabase';

export type Team = TeamType;

export interface DraftContextType {
  teams: Team[];
  players: Player[];  // Undrafted players
  draftedPlayers: Array<Player & { team_id: string; team_name: string; pick_number?: number }>;
  draftPicks: DraftPick[];
  currentPick: number;
  isPaused: boolean;
  timeLeft: number;
  isLoading: boolean;
  selectPlayer: (playerId: string) => Promise<void>;
  skipPick: () => void;
  togglePause: () => void;
  resetDraft: () => Promise<void>;
}
