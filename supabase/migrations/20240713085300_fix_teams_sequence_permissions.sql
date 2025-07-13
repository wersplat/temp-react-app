-- First, ensure the sequence exists
DO $$
BEGIN
  -- Check if the sequence exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public' 
    AND sequence_name = 'teams_id_seq'
  ) THEN
    -- If it doesn't exist, create it
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
  END IF;
END $$;

-- Now grant the necessary permissions
GRANT USAGE, SELECT ON SEQUENCE public.teams_id_seq TO authenticated;
