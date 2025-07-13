-- Create or replace the function that will be triggered
CREATE OR REPLACE FUNCTION public.update_draft_pick_position()
RETURNS TRIGGER AS $$
BEGIN
  -- When a draft pick is inserted or updated, set the player_position
  -- to the current position of the player in the players table
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    NEW.player_position := (
      SELECT position 
      FROM public.players 
      WHERE id = NEW.player_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS update_draft_pick_position_trigger ON public.draft_picks;

-- Create the trigger that fires before insert or update on draft_picks
CREATE TRIGGER update_draft_pick_position_trigger
BEFORE INSERT OR UPDATE ON public.draft_picks
FOR EACH ROW
WHEN (NEW.player_id IS NOT NULL)
EXECUTE FUNCTION public.update_draft_pick_position();

-- Also create a trigger to update draft_picks when a player's position changes
CREATE OR REPLACE FUNCTION public.update_draft_picks_on_position_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When a player's position is updated, update all draft picks for that player
  IF NEW.position IS DISTINCT FROM OLD.position THEN
    UPDATE public.draft_picks
    SET player_position = NEW.position,
        updated_at = NOW()
    WHERE player_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS update_draft_picks_on_position_change_trigger ON public.players;

-- Create the trigger that fires after update on players
CREATE TRIGGER update_draft_picks_on_position_change_trigger
AFTER UPDATE OF position ON public.players
FOR EACH ROW
WHEN (NEW.position IS DISTINCT FROM OLD.position)
EXECUTE FUNCTION public.update_draft_picks_on_position_change();

-- Update existing draft_picks with current player positions
UPDATE public.draft_picks dp
SET player_position = p.position,
    updated_at = NOW()
FROM public.players p
WHERE dp.player_id = p.id
  AND dp.player_position IS DISTINCT FROM p.position;
