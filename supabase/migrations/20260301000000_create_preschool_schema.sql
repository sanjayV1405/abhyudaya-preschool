-- ==============================================================================
-- ABHYUDAYA PRESCHOOL — COMPLETE DATABASE MIGRATION
-- Database: Supabase PostgreSQL
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT NOT NULL,
    age_group TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'foundations',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    timings TEXT,
    color TEXT DEFAULT '#e0d0f8',
    icon TEXT DEFAULT '🎒',
    image_url TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for programs
CREATE INDEX IF NOT EXISTS idx_programs_published ON public.programs(published);
CREATE INDEX IF NOT EXISTS idx_programs_category ON public.programs(category);

-- 2. ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_name TEXT NOT NULL CHECK (char_length(trim(parent_name)) >= 2),
    phone TEXT NOT NULL CHECK (char_length(trim(phone)) >= 7),
    email TEXT,
    child_name TEXT,
    child_age TEXT,
    program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    message TEXT,
    enquiry_type TEXT NOT NULL DEFAULT 'admission' CHECK (enquiry_type IN ('admission', 'campus_visit', 'general')),
    preferred_date DATE,
    preferred_slot TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'enrolled', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for enquiries
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_program_id ON public.enquiries(program_id);

-- 3. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    event_date DATE NOT NULL,
    image_url TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(published);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date ASC);

-- 4. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    content TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

-- 5. GALLERY TABLE
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Classroom',
    emoji TEXT DEFAULT '📸',
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gallery_published ON public.gallery(published);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery(category);

-- 6. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_display_name TEXT NOT NULL CHECK (char_length(trim(parent_display_name)) > 0),
    feedback TEXT NOT NULL CHECK (char_length(trim(feedback)) > 0),
    child_info TEXT,
    avatar TEXT DEFAULT '👩‍💼',
    rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_testimonials_published ON public.testimonials(published);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Programs RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published programs" ON public.programs;
CREATE POLICY "Public can view published programs"
    ON public.programs
    FOR SELECT
    TO anon, authenticated
    USING (published = true);

DROP POLICY IF EXISTS "Admins full access to programs" ON public.programs;
CREATE POLICY "Admins full access to programs"
    ON public.programs
    FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- Enquiries RLS (Strict: public can INSERT valid enquiries, CANNOT SELECT, UPDATE, DELETE)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
CREATE POLICY "Public can submit enquiries"
    ON public.enquiries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        char_length(trim(parent_name)) >= 2 AND
        char_length(trim(phone)) >= 7
    );

DROP POLICY IF EXISTS "Admins full access to enquiries" ON public.enquiries;
CREATE POLICY "Admins full access to enquiries"
    ON public.enquiries
    FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- Events RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events"
    ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (published = true);

DROP POLICY IF EXISTS "Admins full access to events" ON public.events;
CREATE POLICY "Admins full access to events"
    ON public.events
    FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- Announcements RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published announcements" ON public.announcements;
CREATE POLICY "Public can view published announcements"
    ON public.announcements
    FOR SELECT
    TO anon, authenticated
    USING (published = true);

DROP POLICY IF EXISTS "Admins full access to announcements" ON public.announcements;
CREATE POLICY "Admins full access to announcements"
    ON public.announcements
    FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- Gallery RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published gallery" ON public.gallery;
CREATE POLICY "Public can view published gallery"
    ON public.gallery
    FOR SELECT
    TO anon, authenticated
    USING (published = true);

DROP POLICY IF EXISTS "Admins full access to gallery" ON public.gallery;
CREATE POLICY "Admins full access to gallery"
    ON public.gallery
    FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- Testimonials RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published testimonials" ON public.testimonials;
CREATE POLICY "Public can view published testimonials"
    ON public.testimonials
    FOR SELECT
    TO anon, authenticated
    USING (published = true);

DROP POLICY IF EXISTS "Admins full access to testimonials" ON public.testimonials;
CREATE POLICY "Admins full access to testimonials"
    ON public.testimonials
    FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (for Supabase Storage)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('preschool-media', 'preschool-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view objects in 'preschool-media'
DROP POLICY IF EXISTS "Public can view preschool-media" ON storage.objects;
CREATE POLICY "Public can view preschool-media"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'preschool-media');

-- Authenticated admins can upload objects
DROP POLICY IF EXISTS "Admins can upload to preschool-media" ON storage.objects;
CREATE POLICY "Admins can upload to preschool-media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'preschool-media' AND auth.role() = 'authenticated');

-- Authenticated admins can delete objects
DROP POLICY IF EXISTS "Admins can delete from preschool-media" ON storage.objects;
CREATE POLICY "Admins can delete from preschool-media"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'preschool-media' AND auth.role() = 'authenticated');
