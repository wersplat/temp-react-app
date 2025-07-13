-- This migration adds owner_id to teams table and sets up RLS policies
-- It's designed to be idempotent and safe to run multiple times

-- 1. Add owner_id column if it doesn't exist
DO $$
BEGIN
  -- Check if owner_id column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teams' 
    AND column_name = 'owner_id'
  ) THEN
    -- Add the column with a foreign key reference
    ALTER TABLE public.teams 
    ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Add a comment for documentation
    COMMENT ON COLUMN public.teams.owner_id IS 'References auth.users.id. Owner of the team.';
  END IF;
END $$;

-- 2. Create index on owner_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'idx_teams_owner_id' 
    AND tablename = 'teams'
  ) THEN
    CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
  END IF;
END $$;

-- 3. Update RLS policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.teams;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.teams;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.teams;
  DROP POLICY IF EXISTS "Enable all for admins" ON public.teams;
  
  -- Create new policies
  -- Allow all users to read teams
  EXECUTE 'CREATE POLICY "Enable read access for all users" ON public.teams FOR SELECT USING (true)';
  
  -- Allow authenticated users to insert their own teams
  EXECUTE 'CREATE POLICY "Enable insert for authenticated users" ON public.teams 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id)';
    
  -- Allow users to update their own teams
  EXECUTE 'CREATE POLICY "Enable update for team owners" ON public.teams 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id)';
    
  -- Allow admins to do anything
  EXECUTE 'CREATE POLICY "Enable all for admins" ON public.teams 
    USING (auth.jwt() ->> ''email'' LIKE ''%@admin.com'')
    WITH CHECK (auth.jwt() ->> ''email'' LIKE ''%@admin.com'')';
    
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error setting up RLS policies: %', SQLERRM;
END $$;

-- 4. Create or replace the function to set the owner_id on insert
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger if it doesn't exist
DO $$
BEGIN
  -- Drop the trigger if it exists
  EXECUTE 'DROP TRIGGER IF EXISTS on_team_created ON public.teams';
  
  -- Create the trigger
  EXECUTE 'CREATE TRIGGER on_team_created
    BEFORE INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_team()';
    
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error setting up trigger: %', SQLERRM;
END $$;

-- 6. Update existing teams to have an owner if they don't have one
-- This will assign the first admin user as the owner of all existing teams
DO $$
BEGIN
  -- Only run if there are teams without an owner
  IF EXISTS (SELECT 1 FROM public.teams WHERE owner_id IS NULL LIMIT 1) THEN
    -- Get the first admin user, or the first user if no admin exists
    DECLARE
      admin_id UUID;
    BEGIN
      -- Try to find an admin user first
      SELECT id INTO admin_id 
      FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin' 
      OR email LIKE '%@admin.com'
      LIMIT 1;
      
      -- If no admin, get the first user
      IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM auth.users ORDER BY created_at LIMIT 1;
      END IF;
      
      -- Update teams without an owner
      IF admin_id IS NOT NULL THEN
        UPDATE public.teams 
        SET owner_id = admin_id 
        WHERE owner_id IS NULL;
        
        RAISE NOTICE 'Assigned owner_id % to existing teams', admin_id;
      END IF;
    END;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error updating existing teams: %', SQLERRM;
END $$;

-- 7. Grant necessary permissions
GRANT ALL ON public.teams TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.teams_id_seq TO authenticated;
