-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.events IS 'Events for which drafts are organized';
COMMENT ON COLUMN public.events.name IS 'Name of the event';
COMMENT ON COLUMN public.events.start_date IS 'When the event starts';
COMMENT ON COLUMN public.events.end_date IS 'When the event ends';
COMMENT ON COLUMN public.events.is_active IS 'Whether the event is currently active';
COMMENT ON COLUMN public.events.created_by IS 'User who created the event';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);

-- Set up RLS policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Enable read access for all users
CREATE POLICY "Enable read access for all users" 
ON public.events 
FOR SELECT 
USING (true);

-- Enable insert for authenticated users
CREATE POLICY "Enable insert for authenticated users" 
ON public.events 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Enable update for event creators and admins
CREATE POLICY "Enable update for event creators and admins" 
ON public.events 
FOR UPDATE 
TO authenticated 
USING (
    created_by = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() AND 
        (raw_user_meta_data->>'role' = 'admin' OR 
         email LIKE '%@admin.com')
    )
);

-- Enable delete for event creators and admins
CREATE POLICY "Enable delete for event creators and admins" 
ON public.events 
FOR DELETE 
TO authenticated 
USING (
    created_by = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() AND 
        (raw_user_meta_data->>'role' = 'admin' OR 
         email LIKE '%@admin.com')
    )
);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to update the updated_at column
CREATE OR REPLACE TRIGGER update_events_modtime
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_events_updated_at();

-- Create a function to get user's events
CREATE OR REPLACE FUNCTION public.get_user_events(p_user_id UUID)
RETURNS SETOF public.events AS $$
BEGIN
    RETURN QUERY
    SELECT e.*
    FROM public.events e
    WHERE e.created_by = p_user_id
    OR EXISTS (
        SELECT 1 
        FROM public.event_participants ep
        WHERE ep.event_id = e.id
        AND ep.user_id = p_user_id
    )
    ORDER BY e.start_date DESC, e.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_events(UUID) TO authenticated;
