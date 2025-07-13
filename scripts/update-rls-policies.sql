-- Enable RLS on all relevant tables if not already enabled
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_picks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.players;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.teams;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.draft_picks;

-- Create policies to allow read access to all users
CREATE POLICY "Enable read access for all users" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.draft_picks
  FOR SELECT USING (true);

-- For write operations, we'll still require authentication
CREATE POLICY "Enable insert for authenticated users only" ON public.draft_picks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.draft_picks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Verify the policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('players', 'teams', 'draft_picks');
