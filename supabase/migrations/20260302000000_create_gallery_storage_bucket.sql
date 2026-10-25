-- ==============================================================================
-- Abhyudaya Preschool: Supabase Storage Setup for Gallery Photos
-- ==============================================================================
-- Idempotent creation of public storage bucket 'gallery' with secure RLS policies.
-- Public visitors have read-only access to view photos.
-- Upload, update, and deletion are strictly restricted to verified administrators.

-- 1. Create or update public 'gallery' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  5242880, -- 5 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- 2. Storage RLS Policies on storage.objects

-- Policy: Public Read Access (Anyone can view photos in the gallery bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read access for preschool gallery images'
  ) THEN
    CREATE POLICY "Public read access for preschool gallery images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'gallery');
  END IF;
END $$;

-- Policy: Admin Upload (Only authorized admins can upload photos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload gallery images'
  ) THEN
    CREATE POLICY "Admins can upload gallery images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'gallery' AND
        public.is_admin()
      );
  END IF;
END $$;

-- Policy: Admin Update (Only authorized admins can update objects)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update gallery images'
  ) THEN
    CREATE POLICY "Admins can update gallery images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'gallery' AND
        public.is_admin()
      )
      WITH CHECK (
        bucket_id = 'gallery' AND
        public.is_admin()
      );
  END IF;
END $$;

-- Policy: Admin Delete (Only authorized admins can delete objects)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete gallery images'
  ) THEN
    CREATE POLICY "Admins can delete gallery images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'gallery' AND
        public.is_admin()
      );
  END IF;
END $$;
