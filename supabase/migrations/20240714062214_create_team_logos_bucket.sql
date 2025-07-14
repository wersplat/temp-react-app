-- Create a storage bucket for team logos
insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do nothing;

-- Set up storage policies for the team-logos bucket
create policy "Public Access"
on storage.objects for select
using (bucket_id = 'team-logos');

create policy "Allow insert with auth"
on storage.objects for insert
to authenticated
with check (bucket_id = 'team-logos');

create policy "Allow update for authenticated users only"
on storage.objects for update
to authenticated
using (bucket_id = 'team-logos');

create policy "Allow delete for authenticated users only"
on storage.objects for delete
to authenticated
using (bucket_id = 'team-logos');
