-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable the Supabase Realtime extension
CREATE EXTENSION IF NOT EXISTS supabase_realtime;

-- Create a storage bucket for team logos
insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (name) do nothing;

-- Set up storage policies for team logos
create policy "Public Access" on storage.objects for select
  using (bucket_id = 'team-logos');

create policy "Users can upload team logos" on storage.objects for insert
  with check (bucket_id = 'team-logos' AND auth.role() = 'authenticated');

create policy "Users can update their own team logos" on storage.objects for update
  using (bucket_id = 'team-logos' AND auth.role() = 'authenticated');

-- Create a function to check if a user is an admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 
    from auth.users 
    where id = auth.uid() 
    and raw_user_meta_data->>'is_admin' = 'true'
  );
end;
$$ language plpgsql security definer;

-- Grant admin permissions on the storage bucket
create policy "Admins have full access to team logos" on storage.objects
  for all
  using (bucket_id = 'team-logos' AND is_admin())
  with check (bucket_id = 'team-logos' AND is_admin());
