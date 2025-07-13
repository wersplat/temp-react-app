-- Add updated_at column to teams if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'teams' AND column_name = 'updated_at') THEN
        ALTER TABLE public.teams
        ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        
        -- Create trigger to update updated_at on row update
        CREATE OR REPLACE FUNCTION update_teams_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_teams_modtime
        BEFORE UPDATE ON public.teams
        FOR EACH ROW
        EXECUTE FUNCTION update_teams_updated_at();
    END IF;
END $$;

-- Add updated_at column to draft_picks if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'draft_picks' AND column_name = 'updated_at') THEN
        ALTER TABLE public.draft_picks
        ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        
        -- Create trigger to update updated_at on row update
        CREATE OR REPLACE FUNCTION update_draft_picks_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_draft_picks_modtime
        BEFORE UPDATE ON public.draft_picks
        FOR EACH ROW
        EXECUTE FUNCTION update_draft_picks_updated_at();
    END IF;
END $$;
