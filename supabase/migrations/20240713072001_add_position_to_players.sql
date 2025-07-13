-- Create a custom enum type for player positions
CREATE TYPE player_position AS ENUM (
  'Point Guard',
  'Shooting Guard',
  'Lock',
  'Power Forward',
  'Center'
);

-- Add position column to players table using the enum type
ALTER TABLE players
ADD COLUMN position player_position;

-- Update RLS policy to include the new column
ALTER POLICY "Enable read access for all users" 
ON public.players 
FOR SELECT 
USING (true);

-- Add a comment to document the column
COMMENT ON COLUMN players.position IS 'Player position (Point Guard, Shooting Guard, Lock, Power Forward, or Center)';

-- Create an index on the position column for better query performance
CREATE INDEX IF NOT EXISTS idx_players_position ON public.players (position);
