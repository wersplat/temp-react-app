-- 1. Add event_id to players table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'players' AND column_name = 'event_id') THEN
        ALTER TABLE public.players
        ADD COLUMN event_id UUID;
        
        -- Add foreign key constraint after adding the column
        ALTER TABLE public.players
        ADD CONSTRAINT fk_players_event
        FOREIGN KEY (event_id) 
        REFERENCES public.events(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Add event_id to teams table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'teams' AND column_name = 'event_id') THEN
        ALTER TABLE public.teams
        ADD COLUMN event_id UUID;
        
        -- Add foreign key constraint after adding the column
        ALTER TABLE public.teams
        ADD CONSTRAINT fk_teams_event
        FOREIGN KEY (event_id) 
        REFERENCES public.events(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Add event_id to draft_picks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'draft_picks' AND column_name = 'event_id') THEN
        ALTER TABLE public.draft_picks
        ADD COLUMN event_id UUID;
        
        -- Add foreign key constraint after adding the column
        ALTER TABLE public.draft_picks
        ADD CONSTRAINT fk_draft_picks_event
        FOREIGN KEY (event_id) 
        REFERENCES public.events(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Add unique constraints
-- For players: (event_id, name) must be unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_players_event_name'
    ) THEN
        ALTER TABLE public.players
        ADD CONSTRAINT uq_players_event_name 
        UNIQUE (event_id, name);
    END IF;
    
    -- For teams: (event_id, slug) must be unique
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_teams_event_slug'
    ) THEN
        -- First, add slug column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'teams' AND column_name = 'slug') THEN
            ALTER TABLE public.teams
            ADD COLUMN slug TEXT;
            
            -- Generate slugs from team names
            UPDATE public.teams
            SET slug = LOWER(REGEXP_REPLACE(name, '[^\w]+', '-', 'g'));
            
            -- Make slug not null after populating
            ALTER TABLE public.teams
            ALTER COLUMN slug SET NOT NULL;
        END IF;
        
        -- Add the unique constraint
        ALTER TABLE public.teams
        ADD CONSTRAINT uq_teams_event_slug
        UNIQUE (event_id, slug);
    END IF;
    
    -- For draft_picks: (event_id, pick) must be unique
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_draft_picks_event_pick'
    ) THEN
        ALTER TABLE public.draft_picks
        ADD CONSTRAINT uq_draft_picks_event_pick
        UNIQUE (event_id, pick_number);
    END IF;
END $$;

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_players_event_id ON public.players (event_id);
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON public.teams (event_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_event_id ON public.draft_picks (event_id);

-- 6. Update RLS policies to include event-based security
-- This is a simplified example - adjust based on your security requirements
DO $$
BEGIN
    -- Update teams RLS to only allow access to teams in the same event
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Enable read access for all users') THEN
        DROP POLICY "Enable read access for all users" ON public.teams;
    END IF;
    
    CREATE POLICY "Enable read access for teams in same event" 
    ON public.teams
    FOR SELECT 
    USING (
        -- Allow read if the user has access to the event
        EXISTS (
            SELECT 1 FROM public.event_participants ep
            WHERE ep.event_id = teams.event_id
            AND ep.user_id = auth.uid()
        )
    );
    
    -- Similar updates for players and draft_picks tables
    -- ... (add similar policies for other tables as needed)
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating RLS policies: %', SQLERRM;
END $$;
