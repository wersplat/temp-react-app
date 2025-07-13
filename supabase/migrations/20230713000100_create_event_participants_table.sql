-- Create event_participants table to track which users can access which events
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('owner', 'admin', 'manager', 'participant', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.event_participants IS 'Tracks which users have access to which events and their roles';
COMMENT ON COLUMN public.event_participants.role IS 'Role of the user in the event (owner, admin, manager, participant, viewer)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_role ON public.event_participants(role);

-- Set up RLS policies
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Enable read access for participants of the event
CREATE POLICY "Enable read access for event participants" 
ON public.event_participants 
FOR SELECT 
USING (
    -- Event creator can see all participants
    EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = event_id 
        AND e.created_by = auth.uid()
    )
    -- Or the user is a participant themselves
    OR user_id = auth.uid()
);

-- Enable insert for event creators and admins
CREATE POLICY "Enable insert for event creators and admins" 
ON public.event_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (
    -- Event creator can add participants
    EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = event_id 
        AND e.created_by = auth.uid()
    )
    -- Or an admin can add participants
    OR EXISTS (
        SELECT 1 
        FROM public.events e
        JOIN public.event_participants ep ON e.id = ep.event_id
        WHERE e.id = event_id
        AND ep.user_id = auth.uid()
        AND ep.role IN ('owner', 'admin')
    )
);

-- Enable update for event creators and admins
CREATE POLICY "Enable update for event creators and admins" 
ON public.event_participants 
FOR UPDATE 
TO authenticated 
USING (
    -- Event creator can update any participant
    EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = event_id 
        AND e.created_by = auth.uid()
    )
    -- Or an admin can update participants
    OR EXISTS (
        SELECT 1 
        FROM public.events e
        JOIN public.event_participants ep ON e.id = ep.event_id
        WHERE e.id = event_id
        AND ep.user_id = auth.uid()
        AND ep.role IN ('owner', 'admin')
    )
)
WITH CHECK (
    -- Same conditions as USING
    EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = event_id 
        AND e.created_by = auth.uid()
    )
    OR EXISTS (
        SELECT 1 
        FROM public.events e
        JOIN public.event_participants ep ON e.id = ep.event_id
        WHERE e.id = event_id
        AND ep.user_id = auth.uid()
        AND ep.role IN ('owner', 'admin')
    )
);

-- Enable delete for event creators and admins
CREATE POLICY "Enable delete for event creators and admins" 
ON public.event_participants 
FOR DELETE 
TO authenticated 
USING (
    -- Event creator can remove any participant
    EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = event_id 
        AND e.created_by = auth.uid()
    )
    -- Or an admin can remove participants (but not themselves)
    OR (
        user_id != auth.uid()
        AND EXISTS (
            SELECT 1 
            FROM public.events e
            JOIN public.event_participants ep ON e.id = ep.event_id
            WHERE e.id = event_id
            AND ep.user_id = auth.uid()
            AND ep.role IN ('owner', 'admin')
        )
    )
);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_event_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to update the updated_at column
CREATE OR REPLACE TRIGGER update_event_participants_modtime
BEFORE UPDATE ON public.event_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_event_participants_updated_at();

-- Create a function to add a participant to an event
CREATE OR REPLACE FUNCTION public.add_event_participant(
    p_event_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'participant'
) 
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Validate role
    IF p_role NOT IN ('owner', 'admin', 'manager', 'participant', 'viewer') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid role. Must be one of: owner, admin, manager, participant, viewer',
            'error_code', 'INVALID_ROLE'
        );
    END IF;
    
    -- Check if the user has permission to add participants
    IF NOT EXISTS (
        SELECT 1 
        FROM public.events e
        LEFT JOIN public.event_participants ep ON e.id = ep.event_id AND ep.user_id = auth.uid()
        WHERE e.id = p_event_id
        AND (
            -- Event creator can add anyone
            e.created_by = auth.uid()
            -- Or an admin can add non-owners/admins
            OR (
                ep.role IN ('owner', 'admin')
                AND p_role NOT IN ('owner', 'admin')
            )
        )
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'You do not have permission to add participants to this event',
            'error_code', 'PERMISSION_DENIED'
        );
    END IF;
    
    -- Add or update the participant
    INSERT INTO public.event_participants (event_id, user_id, role)
    VALUES (p_event_id, p_user_id, p_role)
    ON CONFLICT (event_id, user_id) 
    DO UPDATE SET 
        role = EXCLUDED.role,
        updated_at = NOW()
    RETURNING 
        jsonb_build_object(
            'id', id,
            'event_id', event_id,
            'user_id', user_id,
            'role', role,
            'created_at', created_at,
            'updated_at', updated_at
        ) INTO v_result;
    
    -- Add success status
    v_result := v_result || '{"success": true}';
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_event_participant(UUID, UUID, TEXT) TO authenticated;
