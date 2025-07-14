-- Drop existing events table if it exists
DROP TABLE IF EXISTS public.events CASCADE;

-- Recreate the events table with the correct schema
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date,
  num_teams integer NOT NULL,
  picks_per_team integer NOT NULL,
  draft_type text NOT NULL,
  pick_time_seconds integer,
  prize_pool numeric,
  prize_breakdown jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean,
  CONSTRAINT events_pkey PRIMARY KEY (id)
);

-- Add comments for documentation
COMMENT ON TABLE public.events IS 'Events for which drafts are organized';

-- Recreate any indexes that were on the original table
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- Recreate RLS policies if they were present
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Recreate any necessary policies
CREATE POLICY "Enable read access for all users" 
ON public.events 
FOR SELECT 
USING (true);

-- Add any additional policies or constraints that were present in the original table
