-- Enable Row Level Security on all tables
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.draft_picks ENABLE ROW LEVEL SECURITY;

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  team TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Draft picks table
CREATE TABLE IF NOT EXISTS public.draft_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_number INTEGER NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  player_name TEXT,
  player_position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pick_number)
);

-- RLS Policies for Teams
CREATE POLICY "Enable read access for all users" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.teams
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for Players
CREATE POLICY "Enable read access for all users" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.players
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.players
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for Draft Picks
CREATE POLICY "Enable read access for all users" ON public.draft_picks
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.draft_picks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.draft_picks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Create the stored procedure for drafting a player
CREATE OR REPLACE FUNCTION public.draft_player_transaction(
  p_player_id UUID,
  p_team_id UUID,
  p_pick_number INTEGER,
  p_player_name TEXT,
  p_player_position TEXT
) RETURNS VOID AS $$
DECLARE
  v_player_available BOOLEAN;
BEGIN
  -- Check if player is available
  SELECT available INTO v_player_available
  FROM public.players
  WHERE id = p_player_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found';
  END IF;
  
  IF NOT v_player_available THEN
    RAISE EXCEPTION 'Player is already drafted';
  END IF;
  
  -- Create draft pick
  INSERT INTO public.draft_picks (
    pick_number,
    team_id,
    player_id,
    player_name,
    player_position
  ) VALUES (
    p_pick_number,
    p_team_id,
    p_player_id,
    p_player_name,
    p_player_position
  );
  
  -- Mark player as drafted
  UPDATE public.players
  SET 
    available = false,
    team = (SELECT name FROM public.teams WHERE id = p_team_id)
  WHERE id = p_player_id;
  
  -- Update the updated_at timestamp
  UPDATE public.players
  SET updated_at = NOW()
  WHERE id = p_player_id;
  
  -- Update the team's updated_at timestamp
  UPDATE public.teams
  SET updated_at = NOW()
  WHERE id = p_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the function to reset the draft
CREATE OR REPLACE FUNCTION public.reset_draft() 
RETURNS VOID AS $$
BEGIN
  -- Reset all players to available
  UPDATE public.players
  SET 
    available = true,
    team = NULL,
    updated_at = NOW();
    
  -- Delete all draft picks
  DELETE FROM public.draft_picks;
  
  -- Update timestamps for all teams
  UPDATE public.teams
  SET updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.draft_player_transaction(UUID, UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_draft() TO authenticated;
