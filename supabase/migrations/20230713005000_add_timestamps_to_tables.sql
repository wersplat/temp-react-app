-- Add created_at and updated_at columns to teams table if they don't exist
DO $$
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'teams' AND column_name = 'created_at') THEN
        ALTER TABLE public.teams
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'teams' AND column_name = 'updated_at') THEN
        ALTER TABLE public.teams
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create or replace the update_modified_column function
CREATE OR REPLACE FUNCTION public.update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid duplicates
DROP TRIGGER IF EXISTS update_teams_modtime ON public.teams;

-- Create the trigger to update the updated_at column on row update
CREATE TRIGGER update_teams_modtime
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();
