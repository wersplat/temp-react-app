import { supabase } from '../lib/supabase';
import type { Event, DbEvent } from './supabase';

export const eventsApi = {
  /**
   * Fetches all events from the database
   */
  async getAll(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      // Transform database events to application events format
      return (data as DbEvent[]).map(event => this.mapDbEventToEvent(event));
    } catch (error) {
      console.error('Error in eventsApi.getAll:', error);
      return [];
    }
  },

  /**
   * Fetches a single event by ID
   */
  async getById(id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching event ${id}:`, error);
        return null;
      }

      return data ? this.mapDbEventToEvent(data as DbEvent) : null;
    } catch (error) {
      console.error(`Error in eventsApi.getById(${id}):`, error);
      return null;
    }
  },

  /**
   * Creates a new event
   */
  async create(
    name: string,
    date: string | null = null,
    isActive: boolean = true,
    draftType: string = 'snake',
    numTeams: number = 12,
    pickTimeSeconds: number | null = 60,
    picksPerTeam: number = 15,
    prizePool: number | null = null,
    createdBy: string | null = null
  ): Promise<Event | null> {
    try {
      const newEvent: Omit<DbEvent, 'id' | 'created_at' | 'updated_at'> = {
        name,
        date,
        is_active: isActive,
        draft_type: draftType,
        num_teams: numTeams,
        pick_time_seconds: pickTimeSeconds,
        picks_per_team: picksPerTeam,
        prize_pool: prizePool,
        prize_breakdown: null,
        created_by: createdBy
      };

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return null;
      }

      return data ? this.mapDbEventToEvent(data as DbEvent) : null;
    } catch (error) {
      console.error('Error in eventsApi.create:', error);
      return null;
    }
  },

  /**
   * Updates an existing event
   */
  async update(
    id: string,
    updates: Partial<Omit<DbEvent, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as Partial<DbEvent>)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating event ${id}:`, error);
        return null;
      }

      return data ? this.mapDbEventToEvent(data as DbEvent) : null;
    } catch (error) {
      console.error(`Error in eventsApi.update(${id}):`, error);
      return null;
    }
  },

  /**
   * Deletes an event
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting event ${id}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error in eventsApi.delete(${id}):`, error);
      return false;
    }
  },

  /**
   * Helper function to map database event to application event
   */
  mapDbEventToEvent(dbEvent: DbEvent): Event {
    return {
      id: dbEvent.id,
      name: dbEvent.name,
      startDate: dbEvent.date,
      endDate: null, // Add this if you have an end date in your database
      isActive: dbEvent.is_active,
      is_active: dbEvent.is_active,
      createdBy: dbEvent.created_by || null,
      createdAt: dbEvent.created_at,
      updatedAt: dbEvent.updated_at || null,
      draftType: dbEvent.draft_type,
      numTeams: dbEvent.num_teams,
      pickTimeSeconds: dbEvent.pick_time_seconds,
      picksPerTeam: dbEvent.picks_per_team,
      prizePool: dbEvent.prize_pool,
      prizeBreakdown: dbEvent.prize_breakdown
    };
  },

  /**
   * Subscribes to events changes
   */
  subscribeToEvents(callback: () => void) {
    const subscription = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'events' 
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};
