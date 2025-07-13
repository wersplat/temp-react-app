-- 1. First, ensure the teams table has the updated_at column
DO $$
BEGIN
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'teams' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.teams
        ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        
        -- Create update trigger
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

-- 2. Update draft_picks table
DO $$
BEGIN
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'draft_picks' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.draft_picks
        ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        
        -- Create update trigger
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
    
    -- Add created_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'draft_picks' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.draft_picks
        ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Update players table
DO $$
BEGIN
    -- Add position if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'position'
    ) THEN
        -- Create the enum type if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_type 
            WHERE typname = 'player_position'
        ) THEN
            CREATE TYPE player_position AS ENUM (
                'Point Guard',
                'Shooting Guard',
                'Small Forward',
                'Power Forward',
                'Center',
                'Guard',
                'Forward',
                'Utility',
                'Flex'
            );
        END IF;
        
        -- Add the column with the enum type
        ALTER TABLE public.players
        ADD COLUMN position player_position;
    END IF;
    
    -- Remove team column if it exists (migrate to draft_picks)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'team'
    ) THEN
        -- Migrate team assignments to draft_picks if not already done
        -- This is a simplified migration - you might need to adjust based on your data model
        INSERT INTO public.draft_picks (team_id, player_id, player_name, player_position, created_at, updated_at)
        SELECT p.team, p.id, p.name, p.position, NOW(), NOW()
        FROM public.players p
        WHERE p.team IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 
            FROM public.draft_picks dp 
            WHERE dp.player_id = p.id
        );
        
        -- Now drop the team column
        ALTER TABLE public.players
        DROP COLUMN IF EXISTS team;
    END IF;
    
    -- Remove available column if it exists (now determined by draft_picks)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'available'
    ) THEN
        ALTER TABLE public.players
        DROP COLUMN IF EXISTS available;
    END IF;
    
    -- Remove photo_url if it exists (if not keeping player photos)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE public.players
        DROP COLUMN IF EXISTS photo_url;
    END IF;
END $$;

-- 4. Create or update the draft_player_transaction function
CREATE OR REPLACE FUNCTION public.draft_player_transaction(
    p_player_id UUID,
    p_team_id UUID,
    p_pick_number INTEGER,
    p_event_id UUID,
    p_created_by UUID
) RETURNS JSONB AS $$
DECLARE
    v_player_record RECORD;
    v_result JSONB;
BEGIN
    -- Start a transaction
    BEGIN
        -- Get player details with FOR UPDATE to lock the row
        SELECT * INTO v_player_record
        FROM public.players
        WHERE id = p_player_id
        FOR UPDATE;
        
        -- Check if player exists
        IF v_player_record IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Player not found',
                'error_code', 'PLAYER_NOT_FOUND'
            );
        END IF;
        
        -- Check if player is already drafted in this event
        IF EXISTS (
            SELECT 1 
            FROM public.draft_picks 
            WHERE player_id = p_player_id 
            AND event_id = p_event_id
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Player is already drafted in this event',
                'error_code', 'PLAYER_ALREADY_DRAFTED'
            );
        END IF;
        
        -- Create the draft pick
        INSERT INTO public.draft_picks (
            pick_number,
            team_id,
            player_id,
            player_name,
            player_position,
            event_id,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            p_pick_number,
            p_team_id,
            p_player_id,
            v_player_record.name,
            v_player_record.position,
            p_event_id,
            p_created_by,
            NOW(),
            NOW()
        )
        RETURNING jsonb_build_object(
            'id', id,
            'pick_number', pick_number,
            'team_id', team_id,
            'player_id', player_id,
            'player_name', player_name,
            'player_position', player_position,
            'event_id', event_id,
            'created_at', created_at,
            'updated_at', updated_at
        ) INTO v_result;
        
        -- Update the team's updated_at timestamp
        UPDATE public.teams
        SET updated_at = NOW()
        WHERE id = p_team_id;
        
        -- Add success status to the result
        v_result := v_result || '{"success": true}';
        
        RETURN v_result;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', SQLERRM,
            'error_code', SQLSTATE
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a function to get available players
CREATE OR REPLACE FUNCTION public.get_available_players(
    p_event_id UUID
) 
RETURNS TABLE (
    id UUID,
    name TEXT,
    position TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.position::TEXT,
        p.created_at,
        p.updated_at
    FROM 
        public.players p
    WHERE 
        p.event_id = p_event_id
        AND NOT EXISTS (
            SELECT 1 
            FROM public.draft_picks dp 
            WHERE dp.player_id = p.id 
            AND dp.event_id = p_event_id
        )
    ORDER BY 
        p.position, p.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.draft_player_transaction(UUID, UUID, INTEGER, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_players(UUID) TO authenticated;
