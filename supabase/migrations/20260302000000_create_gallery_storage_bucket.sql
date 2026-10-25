-- ==============================================================================
-- Abhyudaya Preschool: Fix Gallery Storage Bucket + RLS Policies
-- ==============================================================================
-- Run this in Supabase Dashboard → SQL Editor.
-- This REPLACES the previous gallery storage policies.
-- Allows authenticated admin users to upload using the anon key + user session.
-- ==============================================================================

-- 1. Create or update public 'gallery' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  5242880, -- 5 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

-- 2. DROP old policies (if they exist) and recreate cleanly
DROP POLICY IF EXISTS "Public read access for preschool gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete gallery images" ON storage.objects;
-- Also drop any other leftover gallery policies from older migrations
DROP POLICY IF EXISTS "Gallery public read" ON storage.objects;
DROP POLICY IF EXISTS "Gallery admin insert" ON storage.objects;
DROP POLICY IF EXISTS "Gallery admin update" ON storage.objects;
DROP POLICY IF EXISTS "Gallery admin delete" ON storage.objects;

-- 3. Public read — anyone (even unauthenticated) can view gallery photos
CREATE POLICY "Gallery public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

-- 4. Authenticated INSERT — any signed-in Supabase user can upload
--    (The admin panel authenticates via Supabase Auth before reaching this)
CREATE POLICY "Gallery admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gallery');

-- 5. Authenticated UPDATE — any signed-in user can update objects
CREATE POLICY "Gallery admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'gallery')
  WITH CHECK (bucket_id = 'gallery');

-- 6. Authenticated DELETE — any signed-in user can delete objects
CREATE POLICY "Gallery admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'gallery');
