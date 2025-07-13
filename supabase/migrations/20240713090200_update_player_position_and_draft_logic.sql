-- 1. Create or update the player_position enum type
DO $$
BEGIN
    -- Check if the enum type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'player_position') THEN
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
    
    -- Update the players table to use the enum type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'players' AND column_name = 'position' 
              AND data_type != 'USER-DEFINED') THEN
        -- Convert text column to enum type
        ALTER TABLE public.players 
        ALTER COLUMN position TYPE player_position 
        USING position::player_position;
    END IF;
END $$;

-- 2. Add created_by to draft_picks if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'draft_picks' AND column_name = 'created_by') THEN
        ALTER TABLE public.draft_picks
        ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        -- Add a comment for documentation
        COMMENT ON COLUMN public.draft_picks.created_by IS 'User who made the draft pick';
    END IF;
END $$;

-- 3. Update the draft_player_transaction function to include created_by and handle positions
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

-- 4. Create a function to pre-populate draft picks for an event
CREATE OR REPLACE FUNCTION public.setup_draft_picks(
    p_event_id UUID,
    p_rounds INTEGER DEFAULT 10,
    p_teams INTEGER[] DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_team_ids UUID[];
    v_team_count INTEGER;
    v_pick_number INTEGER := 1;
    v_round INTEGER;
    v_team_index INTEGER;
    v_team_id UUID;
    v_direction INTEGER := 1; -- 1 for normal order, -1 for reverse
    v_result JSONB := '{"success": true, "picks_created": 0, "picks_skipped": 0}';
    v_skipped_picks JSONB := '[]';
BEGIN
    -- Get team IDs for the event
    IF p_teams IS NULL OR array_length(p_teams, 1) = 0 THEN
        SELECT array_agg(id) INTO v_team_ids
        FROM public.teams
        WHERE event_id = p_event_id;
    ELSE
        -- Use the provided team IDs, but verify they belong to the event
        SELECT array_agg(id) INTO v_team_ids
        FROM public.teams
        WHERE id = ANY(p_teams)
        AND event_id = p_event_id;
    END IF;
    
    -- Check if we have teams
    v_team_count := array_length(v_team_ids, 1);
    IF v_team_count IS NULL OR v_team_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No teams found for this event',
            'error_code', 'NO_TEAMS_FOUND'
        );
    END IF;
    
    -- Process each round
    FOR v_round IN 1..p_rounds LOOP
        -- Reverse order for even rounds (snake draft)
        IF v_round % 2 = 0 THEN
            v_team_ids := array_reverse(v_team_ids);
        END IF;
        
        -- Process each team in the round
        FOR v_team_index IN 1..v_team_count LOOP
            v_team_id := v_team_ids[v_team_index];
            
            -- Check if this pick already exists
            IF NOT EXISTS (
                SELECT 1 
                FROM public.draft_picks 
                WHERE event_id = p_event_id 
                AND team_id = v_team_id 
                AND pick_number = v_pick_number
            ) THEN
                -- Create a new draft pick record with no player assigned
                INSERT INTO public.draft_picks (
                    pick_number,
                    team_id,
                    event_id,
                    created_at,
                    updated_at
                ) VALUES (
                    v_pick_number,
                    v_team_id,
                    p_event_id,
                    NOW(),
                    NOW()
                );
                
                v_result := jsonb_set(
                    v_result,
                    '{picks_created}',
                    to_jsonb((v_result->>'picks_created')::int + 1)
                );
            ELSE
                v_skipped_picks := v_skipped_picks || to_jsonb(v_pick_number);
                v_result := jsonb_set(
                    v_result,
                    '{picks_skipped}',
                    to_jsonb((v_result->>'picks_skipped')::int + 1)
                );
            END IF;
            
            v_pick_number := v_pick_number + 1;
        END LOOP;
    END LOOP;
    
    -- Add skipped picks to the result
    IF jsonb_array_length(v_skipped_picks) > 0 THEN
        v_result := v_result || jsonb_build_object('skipped_picks', v_skipped_picks);
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE,
        'picks_created', COALESCE((v_result->>'picks_created')::int, 0),
        'picks_skipped', COALESCE((v_result->>'picks_skipped')::int, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update RLS policies for the new functions
GRANT EXECUTE ON FUNCTION public.draft_player_transaction(UUID, UUID, INTEGER, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_draft_picks(UUID, INTEGER, UUID[]) TO authenticated;

-- 6. Create a function to get available players for an event
CREATE OR REPLACE FUNCTION public.get_available_players(
    p_event_id UUID
) 
RETURNS TABLE (
    id UUID,
    name TEXT,
    position player_position,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.position::player_position,
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

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_available_players(UUID) TO authenticated;
