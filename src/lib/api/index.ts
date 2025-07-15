import type { Event, Player, Team, DraftPick, ApiResponse } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const data = await response.json();
  if (!response.ok) {
    return { error: { message: data.message || 'An error occurred' } };
  }
  return { data };
};

export const eventsApi = {
  create: async (
    name: string,
    date: string,
    isActive: boolean,
    draftType: 'snake' | 'linear',
    numTeams: number,
    pickTimeSeconds: number,
    picksPerTeam: number,
    prizePool: number | null,
    createdBy?: string
  ): Promise<ApiResponse<Event>> => {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        date,
        is_active: isActive,
        draft_type: draftType,
        num_teams: numTeams,
        pick_time_seconds: pickTimeSeconds,
        picks_per_team: picksPerTeam,
        prize_pool: prizePool,
        created_by: createdBy
      })
    });
    return handleResponse<Event>(response);
  },

  getAll: async (): Promise<ApiResponse<Event[]>> => {
    const response = await fetch(`${API_BASE_URL}/events`);
    return handleResponse<Event[]>(response);
  },

  getById: async (id: string): Promise<ApiResponse<Event>> => {
    const response = await fetch(`${API_BASE_URL}/events/${id}`);
    return handleResponse<Event>(response);
  }
};

export const playersApi = {
  create: async (
    gt_psn: string,
    position: string,
    eventId: string
  ): Promise<ApiResponse<Player>> => {
    const response = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gt_psn, position, event_id: eventId })
    });
    return handleResponse<Player>(response);
  },

  getByEvent: async (eventId: string): Promise<ApiResponse<Player[]>> => {
    const response = await fetch(`${API_BASE_URL}/players?event_id=${eventId}`);
    return handleResponse<Player[]>(response);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/players/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<void>(response);
  }
};

export const teamsApi = {
  create: async (
    name: string,
    eventId: string,
    logoUrl?: string
  ): Promise<ApiResponse<Team>> => {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, event_id: eventId, logo_url: logoUrl })
    });
    return handleResponse<Team>(response);
  },

  getByEvent: async (eventId: string): Promise<ApiResponse<Team[]>> => {
    const response = await fetch(`${API_BASE_URL}/teams?event_id=${eventId}`);
    return handleResponse<Team[]>(response);
  },

  updateDraftOrder: async (
    teamId: string,
    draftOrder: number
  ): Promise<ApiResponse<Team>> => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/draft-order`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_order: draftOrder })
    });
    return handleResponse<Team>(response);
  }
};

export const draftApi = {
  startDraft: async (eventId: string): Promise<ApiResponse<{ status: string }>> => {
    const response = await fetch(`${API_BASE_URL}/draft/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId })
    });
    return handleResponse<{ status: string }>(response);
  },

  endDraft: async (eventId: string): Promise<ApiResponse<{ status: string }>> => {
    const response = await fetch(`${API_BASE_URL}/draft/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId })
    });
    return handleResponse<{ status: string }>(response);
  },

  pauseDraft: async (eventId: string): Promise<ApiResponse<{ status: string }>> => {
    const response = await fetch(`${API_BASE_URL}/draft/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId })
    });
    return handleResponse<{ status: string }>(response);
  },

  makePick: async (
    eventId: string,
    teamId: string,
    playerId: string
  ): Promise<ApiResponse<DraftPick>> => {
    const response = await fetch(`${API_BASE_URL}/draft/pick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        team_id: teamId,
        player_id: playerId
      })
    });
    return handleResponse<DraftPick>(response);
  },

  getStatus: async (eventId: string): Promise<ApiResponse<{
    currentPick: number;
    isPaused: boolean;
    isComplete: boolean;
    totalPicks: number;
  }>> => {
    const response = await fetch(`${API_BASE_URL}/draft/status?event_id=${eventId}`);
    return handleResponse<{
      currentPick: number;
      isPaused: boolean;
      isComplete: boolean;
      totalPicks: number;
    }>(response);
  },

  getDraftPicks: async (eventId: string): Promise<ApiResponse<DraftPick[]>> => {
    const response = await fetch(`${API_BASE_URL}/draft/picks?event_id=${eventId}`);
    return handleResponse<DraftPick[]>(response);
  }
};
