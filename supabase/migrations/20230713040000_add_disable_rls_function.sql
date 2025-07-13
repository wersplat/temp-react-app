-- Create a function to disable RLS for the current session
CREATE OR REPLACE FUNCTION public.disable_rls_in_this_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function needs to be run by a superuser or the owner of the database
  -- to modify the session_replication_role setting
  EXECUTE 'SET LOCAL session_replication_role = replica;';
  -- This will disable all triggers and RLS for the current transaction
  -- It's a powerful command that should be used carefully
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.disable_rls_in_this_session() TO authenticated;
