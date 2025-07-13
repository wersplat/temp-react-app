-- This migration fixes the sequence permission issue for the teams table
-- It's safe to run even if the sequence doesn't exist

-- First, check if the sequence exists and is owned by the teams.id column
DO $$
BEGIN
    -- Check if the sequence exists
    IF EXISTS (
        SELECT 1 
        FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename = 'teams_id_seq'
    ) THEN
        -- Grant permissions on the sequence
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.teams_id_seq TO authenticated';
        
        -- Make sure the sequence is owned by the teams.id column
        EXECUTE 'ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id';
    END IF;
    
    -- If the table uses UUID primary key (no sequence), we can skip the sequence permissions
    -- as they're not needed for UUID columns
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        -- If not using UUID, ensure the sequence is properly set up
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_sequences 
            WHERE schemaname = 'public' 
            AND sequencename = 'teams_id_seq'
        ) THEN
            -- Create the sequence if it doesn't exist
            CREATE SEQUENCE public.teams_id_seq
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;
                
            -- Set the sequence as the default for the id column
            ALTER TABLE public.teams 
            ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);
            
            -- Set the sequence ownership
            ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;
            
            -- Grant permissions
            GRANT USAGE, SELECT ON SEQUENCE public.teams_id_seq TO authenticated;
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the migration
    RAISE NOTICE 'Error in teams sequence migration: %', SQLERRM;
END $$;
