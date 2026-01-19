-- Supabase Storage setup for interview recordings
-- This bucket is private; recordings are served via signed URLs from the server.

insert into storage.buckets (id, name, public)
values ('interview-recordings', 'interview-recordings', false)
on conflict (id) do update
set public = false;

-- RLS is already enabled by default on storage.objects in Supabase projects.
