-- This migration fixes the teams sequence issue by conditionally granting permissions
-- only if the sequence exists

DO $$
BEGIN
    -- Check if the sequence exists before trying to grant permissions
    IF EXISTS (
        SELECT 1 
        FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename = 'teams_id_seq'
    ) THEN
        -- Grant permissions only if the sequence exists
        GRANT USAGE, SELECT ON SEQUENCE public.teams_id_seq TO authenticated;
    END IF;
    
    -- Check if we need to create the sequence for UUID primary key tables
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename = 'teams_id_seq'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        -- Create the sequence for non-UUID primary key tables
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
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the migration
    RAISE NOTICE 'Error in teams sequence migration: %', SQLERRM;
END $$;
