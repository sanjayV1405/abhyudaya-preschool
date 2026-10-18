-- ==============================================================================
-- ABHYUDAYA PRESCHOOL — PRODUCTION DATABASE SETUP SCRIPT
-- Database: Supabase PostgreSQL
-- 
-- Safe, Idempotent, and Non-Destructive:
-- 1. Preserves existing tables and adds any missing columns via ADD COLUMN IF NOT EXISTS.
-- 2. Principle of Least Privilege:
--    - "anon" (anonymous public) can ONLY INSERT into "enquiries".
--    - "anon" CANNOT SELECT, UPDATE, or DELETE from "enquiries".
--    - "anon" can ONLY SELECT published records from public content tables.
-- 3. Hardened Administrator Authorization:
--    - Authenticated users must have app_metadata->role = 'admin'
--      OR match verified administrator emails (abhyudayapreschool@gmail.com / admin@abhyudayapreschool.com).
--    - Ordinary authenticated users CANNOT read or modify parent enquiries.
-- 4. Safe & Unapproved Seed Protection:
--    - Starter testimonials default to published = false until school review.
--    - Repeatable seeds using WHERE NOT EXISTS (no duplicate rows on re-runs).
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROGRAMS TABLE
-- ------------------------------------------------------------------------------
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

-- Backfill missing columns if table already existed with older schema
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'foundations';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS timings TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#e0d0f8';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🎒';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_programs_published ON public.programs(published);
CREATE INDEX IF NOT EXISTS idx_programs_category ON public.programs(category);

-- ------------------------------------------------------------------------------
-- 2. ENQUIRIES TABLE (Admissions & Campus Visits)
-- ------------------------------------------------------------------------------
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

-- Backfill missing columns if table already existed with older schema
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS child_name TEXT;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS child_age TEXT;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS enquiry_type TEXT NOT NULL DEFAULT 'admission';
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS preferred_date DATE;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS preferred_slot TEXT;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_program_id ON public.enquiries(program_id);

-- ------------------------------------------------------------------------------
-- 3. EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    event_date DATE NOT NULL,
    image_url TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(published);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date ASC);

-- ------------------------------------------------------------------------------
-- 4. ANNOUNCEMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    content TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. GALLERY TABLE
-- ------------------------------------------------------------------------------
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

ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Classroom';
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '📸';
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_gallery_published ON public.gallery(published);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery(category);

-- ------------------------------------------------------------------------------
-- 6. TESTIMONIALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_display_name TEXT NOT NULL CHECK (char_length(trim(parent_display_name)) > 0),
    feedback TEXT NOT NULL CHECK (char_length(trim(feedback)) > 0),
    child_info TEXT,
    avatar TEXT DEFAULT '👩‍💼',
    rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    published BOOLEAN NOT NULL DEFAULT false, -- Set to false by default until approved
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS child_info TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '👩‍💼';
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS rating INT DEFAULT 5;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_testimonials_published ON public.testimonials(published);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & AUTHORIZATION FUNCTION
-- ==============================================================================

-- Enable RLS on all 6 tables
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Helper function: Determines if the current user is a verified school administrator.
-- Checks app_metadata->role (set via Supabase Dashboard / Admin API)
-- OR checks designated administrator email addresses.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    auth.role() = 'authenticated'
    AND (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      OR lower(auth.jwt() ->> 'email') IN (
        'abhyudayapreschool@gmail.com',
        'jothisanjay659@gmail.com',
        'sreelakshmij67@gmail.com',
        'vkvsvishw91@gmail.com',
        'admin@abhyudayapreschool.com'
      )
    )
  );
$$;

-- ------------------------------------------------------------------------------
-- 1. Enquiries RLS:
--    - Public (anon) & Authenticated visitors can ONLY INSERT valid enquiries.
--    - Public CANNOT SELECT, UPDATE, or DELETE any enquiries.
--    - Verified administrators have full access to view and update enquiries.
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
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. Programs RLS:
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published programs" ON public.programs;
CREATE POLICY "Public can view published programs"
    ON public.programs
    FOR SELECT
    TO anon, authenticated
    USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access to programs" ON public.programs;
DROP POLICY IF EXISTS "Admins manage programs" ON public.programs;
CREATE POLICY "Admins manage programs"
    ON public.programs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Events RLS:
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events"
    ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access to events" ON public.events;
DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Admins manage events"
    ON public.events
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Announcements RLS:
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published announcements" ON public.announcements;
CREATE POLICY "Public can view published announcements"
    ON public.announcements
    FOR SELECT
    TO anon, authenticated
    USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access to announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements"
    ON public.announcements
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Gallery RLS:
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published gallery" ON public.gallery;
CREATE POLICY "Public can view published gallery"
    ON public.gallery
    FOR SELECT
    TO anon, authenticated
    USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access to gallery" ON public.gallery;
DROP POLICY IF EXISTS "Admins manage gallery" ON public.gallery;
CREATE POLICY "Admins manage gallery"
    ON public.gallery
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. Testimonials RLS:
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published testimonials" ON public.testimonials;
CREATE POLICY "Public can view published testimonials"
    ON public.testimonials
    FOR SELECT
    TO anon, authenticated
    USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access to testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials"
    ON public.testimonials
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- LEAST-PRIVILEGE POSTGREST GRANTS
-- ==============================================================================

-- 1. Schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Public Visitors (anon role):
--    - Strictly INSERT on enquiries. CANNOT select, update, or delete.
--    - Strictly SELECT on published public content.
REVOKE ALL ON TABLE public.enquiries FROM anon;
GRANT INSERT ON TABLE public.enquiries TO anon;

REVOKE ALL ON TABLE public.programs FROM anon;
GRANT SELECT ON TABLE public.programs TO anon;

REVOKE ALL ON TABLE public.events FROM anon;
GRANT SELECT ON TABLE public.events TO anon;

REVOKE ALL ON TABLE public.announcements FROM anon;
GRANT SELECT ON TABLE public.announcements TO anon;

REVOKE ALL ON TABLE public.gallery FROM anon;
GRANT SELECT ON TABLE public.gallery TO anon;

REVOKE ALL ON TABLE public.testimonials FROM anon;
GRANT SELECT ON TABLE public.testimonials TO anon;

-- 3. Authenticated role (operations are strictly guarded by public.is_admin()):
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.enquiries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.programs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gallery TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.testimonials TO authenticated;

-- ==============================================================================
-- REPEATABLE INITIAL CONTENT SEED (Idempotent: Uses WHERE NOT EXISTS)
-- ==============================================================================

-- 1. SEED PROGRAMS
INSERT INTO public.programs (title, description, age_group, category, features, timings, color, icon, published)
SELECT v.title, v.description, v.age_group, v.category, v.features::jsonb, v.timings, v.color, v.icon, v.published
FROM (
  VALUES
    ('Daycare', 'A safe and loving environment for toddlers 2 years and above. Supervised care, play, rest, and meals with gentle, attentive teachers.', '2+ years', 'daycare', '["Safe & supervised care", "Age-appropriate play", "Nutritious meals & snacks", "Rest & nap time", "Warm, home-like atmosphere"]', 'Mon–Sat | 9:00 AM – 4:00 PM', '#ffd6b0', '🍼', true),
    ('Playgroup', 'A gentle first step into school life. Sensory play, rhymes, and social bonding in a cosy, home-like setting.', 'Ages 2 – 3 yrs', 'foundations', '["Sensory & tactile play", "Circle time & songs", "Basic motor skills", "Social bonding activities", "Toilet training support"]', 'Mon–Sat | 9:00 AM – 12:30 PM / 4:00 PM', '#e0d0f8', '🎪', true),
    ('Nursery', 'Building curiosity and creativity through structured play, early language skills, and joyful exploration.', 'Ages 3 – 4 yrs', 'foundations', '["Pre-reading & pre-writing", "Number concepts & math play", "Art, craft & music", "Storytelling sessions", "Social & emotional skills"]', 'Mon–Sat | 9:00 AM – 1:00 PM / 4:00 PM', '#b8f0d8', '🌱', true),
    ('LKG & UKG', 'Comprehensive kindergarten program preparing children for primary school with academics, creativity, and character building.', 'Ages 4 – 6 yrs', 'kindergarten', '["Reading & writing readiness", "Numeracy & math concepts", "Science exploration", "Art, craft & outdoor activities", "School readiness skills"]', 'Mon–Sat | 9:00 AM – 3:30 PM / 4:00 PM', '#b8d8f8', '📚', true),
    ('Afterschool Care', 'Safe, supervised afterschool care with homework help, activities, and fun — giving working parents peace of mind.', 'School-going kids', 'daycare', '["Homework assistance", "Reading & activity time", "Healthy snacks", "Indoor & outdoor games", "Safe pickup & care"]', 'Mon–Sat | Up to 4:00 PM', '#fff0b0', '🎒', true),
    ('Weekend Care', 'Fun-filled weekend sessions with creative activities, games, and learning — giving parents a well-deserved break.', 'All ages', 'weekend', '["Creative arts & crafts", "Music & movement", "Group games & storytelling", "Structured fun activities", "Flexible weekend timings"]', 'Weekends | Special Sessions', '#ffd8e4', '🌈', true)
) AS v(title, description, age_group, category, features, timings, color, icon, published)
WHERE NOT EXISTS (
  SELECT 1 FROM public.programs p WHERE p.title = v.title
);

-- 2. SEED TESTIMONIALS (Starter reviews marked as published = false pending school approval)
INSERT INTO public.testimonials (parent_display_name, child_info, feedback, avatar, rating, published)
SELECT v.parent_display_name, v.child_info, v.feedback, v.avatar, v.rating, v.published
FROM (
  VALUES
    ('Priya', 'Mother of Aarav, 4', 'Abhyudaya Preschool transformed my shy boy into a confident, curious child. The teachers are like second moms!', '👩‍💼', 5, false),
    ('Meera', 'Mother of Ananya, 3', 'As a working parent, the caring environment and convenient 9:00 AM to 4:00 PM schedule gives me complete peace of mind. My daughter loves every moment here!', '👩', 5, false),
    ('Sunita', 'Mother of Rohan, 5', 'The play-based learning approach is outstanding. Rohan learned to read, paint, and make friends — all through fun!', '👩‍🦱', 5, false)
) AS v(parent_display_name, child_info, feedback, avatar, rating, published)
WHERE NOT EXISTS (
  SELECT 1 FROM public.testimonials t WHERE t.parent_display_name = v.parent_display_name
);

-- 3. SEED GALLERY (Assets verified in /public directory)
INSERT INTO public.gallery (title, description, image_url, category, emoji, published)
SELECT v.title, v.description, v.image_url, v.category, v.emoji, v.published
FROM (
  VALUES
    ('Our Colourful Classroom', 'Child-safe learning spaces designed for joyful curiosity', '/gallery1.jpg', 'Classroom', '🏫', true),
    ('Fun Movement Activity', 'Kids expressing rhythm and coordination through dance and music', '/gallery2.jpg', 'Activities', '💃', true),
    ('Balloon Day Celebration', 'Outdoor joyous festivities and laughter under open skies', '/gallery3.jpg', 'Outdoor', '🎈', true),
    ('Morning Meditation', 'Calm mindfulness and focus circle at the start of our day', '/gallery4.jpg', 'Meditation', '🧘', true),
    ('Snack Time Together', 'Healthy, nutritious snacks shared in a warm community circle', '/gallery5.jpg', 'Mealtime', '🍱', true)
) AS v(title, description, image_url, category, emoji, published)
WHERE NOT EXISTS (
  SELECT 1 FROM public.gallery g WHERE g.image_url = v.image_url
);

-- 4. SEED ANNOUNCEMENTS
INSERT INTO public.announcements (title, content, published)
SELECT v.title, v.content, v.published
FROM (
  VALUES
    ('🌟 Admissions Open 2026–2027', 'Admissions are now open for Daycare, Playgroup, Nursery, LKG, and UKG at our SS Nagar, Perumanallur campus. Visit us between 9:00 AM and 4:00 PM for campus tours.', true),
    ('🎒 Extended Daycare Timings Support Working Parents', 'Full-day care and afterschool supervision available with nutritious meals, rest sessions, and guided learning from 9:00 AM to 4:00 PM.', true)
) AS v(title, content, published)
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcements a WHERE a.title = v.title
);

-- 5. SEED EVENTS
INSERT INTO public.events (title, description, event_date, published)
SELECT v.title, v.description, (CURRENT_DATE + v.offset_days * INTERVAL '1 day')::date, v.published
FROM (
  VALUES
    ('Annual Sports & Play Day', 'A day filled with games, races, and active celebrations for our little champions and their families.', 14, true),
    ('Open House & Campus Tour Weekend', 'Join our founder Bharani S and educators to explore our classrooms, curriculum, and interactive play areas.', 21, true)
) AS v(title, description, offset_days, published)
WHERE NOT EXISTS (
  SELECT 1 FROM public.events e WHERE e.title = v.title
);
