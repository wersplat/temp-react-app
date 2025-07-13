-- Add player_position column to draft_picks table
ALTER TABLE public.draft_picks 
ADD COLUMN IF NOT EXISTS player_position TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN public.draft_picks.player_position IS 'The position of the player when they were drafted';

-- Update the draft_player_transaction function to include player position
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
  
  -- Create draft pick with player position
  INSERT INTO public.draft_picks (
    pick_number,
    team_id,
    player_id,
    player_name,
    player_position  -- Include player position
  ) VALUES (
    p_pick_number,
    p_team_id,
    p_player_id,
    p_player_name,
    p_player_position  -- Pass through the position parameter
  );
  
  -- Mark player as drafted
  UPDATE public.players
  SET 
    available = false,
    team = p_team_id,
    updated_at = NOW()
  WHERE id = p_player_id;
  
  -- Update the player's updated_at timestamp
  UPDATE public.players
  SET updated_at = NOW()
  WHERE id = p_player_id;
  
  -- Update the team's updated_at timestamp
  UPDATE public.teams
  SET updated_at = NOW()
  WHERE id = p_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy to include the new column
COMMENT ON POLICY "Enable read access for all users" ON public.draft_picks IS 'Allow all users to read draft picks, including player position';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE (player_position) ON TABLE public.draft_picks TO authenticated;

-- Update the reset_draft function to handle the new column
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
