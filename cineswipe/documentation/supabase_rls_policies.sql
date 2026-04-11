-- ============================================================
-- CineSwipe — Supabase RLS Policies
-- Apply these in the Supabase Dashboard > SQL Editor
-- ============================================================

-- NOTE: On Supabase, RLS on storage.objects is managed via the
-- Storage settings in the Dashboard. The ALTER TABLE command below
-- requires superuser/owner privileges which the SQL Editor does NOT
-- have. Instead, go to Storage > Policies in the Supabase Dashboard
-- to enable RLS, or skip this command — Supabase enables RLS on
-- storage.objects by default on newer projects.
--
-- If you get the error:
--   "must be owner of table objects"
-- then RLS is likely already enabled. Skip to the policy commands below.

-- COMMENTED OUT: This requires owner privileges.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Allow public READ access (anyone can view/stream media)
CREATE POLICY "Public read access for media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- 2. Allow only service_role (backend) to INSERT files
CREATE POLICY "Service role can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND auth.role() = 'service_role'
);

-- 3. Allow only service_role (backend) to UPDATE files
CREATE POLICY "Service role can update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media'
  AND auth.role() = 'service_role'
);

-- 4. Allow only service_role (backend) to DELETE files
CREATE POLICY "Service role can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media'
  AND auth.role() = 'service_role'
);

-- ============================================================
-- NOTES:
-- • The backend uses SUPABASE_SERVICE_KEY which has service_role
-- • Mobile/web users can READ (stream) files but cannot modify
-- • Run these ONCE in Supabase SQL Editor
-- • If policies already exist, you may get a "policy already exists"
--   error — that means they are already applied, and you're good.
-- ============================================================
