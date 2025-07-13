-- Add owner_id column to teams table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'teams' 
                 AND column_name = 'owner_id') THEN
    ALTER TABLE public.teams 
    ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the updated_at column
ALTER TABLE public.teams 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Create an index on owner_id for better query performance if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_teams_owner_id' 
    AND tablename = 'teams'
  ) THEN
    CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop policies for teams
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'teams' 
    AND policyname = 'Enable read access for all users'
  ) THEN
    DROP POLICY "Enable read access for all users" ON public.teams;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'teams' 
    AND policyname = 'Enable insert for authenticated users only'
  ) THEN
    DROP POLICY "Enable insert for authenticated users only" ON public.teams;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'teams' 
    AND policyname = 'Enable update for authenticated users'
  ) THEN
    DROP POLICY "Enable update for authenticated users" ON public.teams;
  END IF;
END $$;

-- Create new RLS policies for teams table
-- Allow all users to read teams
CREATE POLICY "Enable read access for all users" ON public.teams
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own teams
CREATE POLICY "Enable insert for authenticated users" ON public.teams
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = owner_id);

-- Allow users to update their own teams
CREATE POLICY "Enable update for team owners" ON public.teams
  FOR UPDATE TO authenticated 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Allow admins to update any team
CREATE POLICY "Enable all for admins" ON public.teams
  USING (auth.jwt() ->> 'email' LIKE '%@admin.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@admin.com');

-- Create or replace the function to set the owner_id on insert
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_team_created ON public.teams;

-- Create the trigger to set the owner_id on insert
CREATE TRIGGER on_team_created
  BEFORE INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_team();

-- Update existing teams to have the owner of the first admin user if owner_id is NULL
-- This is a one-time update for existing data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.teams WHERE owner_id IS NULL LIMIT 1) THEN
    UPDATE public.teams t
    SET owner_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
    WHERE owner_id IS NULL;
  END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.teams TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.teams_id_seq TO authenticated;
