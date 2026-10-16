-- ==============================================================================
-- ABHYUDAYA PRESCHOOL — INITIAL DATA SEED
-- Preserves existing authentic school information, programs, and testimonials
-- ==============================================================================

-- 1. SEED PROGRAMS
INSERT INTO public.programs (title, description, age_group, category, features, timings, color, icon, published)
VALUES
(
    'Daycare',
    'A safe and loving environment for toddlers 2 years and above. Supervised care, play, rest, and meals with gentle, attentive teachers.',
    '2+ years',
    'daycare',
    '["Safe & supervised care", "Age-appropriate play", "Nutritious meals & snacks", "Rest & nap time", "Warm, home-like atmosphere"]'::jsonb,
    'Mon–Sat | 9:00 AM – 4:00 PM',
    '#ffd6b0',
    '🍼',
    true
),
(
    'Playgroup',
    'A gentle first step into school life. Sensory play, rhymes, and social bonding in a cosy, home-like setting.',
    'Ages 2 – 3 yrs',
    'foundations',
    '["Sensory & tactile play", "Circle time & songs", "Basic motor skills", "Social bonding activities", "Toilet training support"]'::jsonb,
    'Mon–Sat | 9:00 AM – 12:30 PM / 4:00 PM',
    '#e0d0f8',
    '🎪',
    true
),
(
    'Nursery',
    'Building curiosity and creativity through structured play, early language skills, and joyful exploration.',
    'Ages 3 – 4 yrs',
    'foundations',
    '["Pre-reading & pre-writing", "Number concepts & math play", "Art, craft & music", "Storytelling sessions", "Social & emotional skills"]'::jsonb,
    'Mon–Sat | 9:00 AM – 1:00 PM / 4:00 PM',
    '#b8f0d8',
    '🌱',
    true
),
(
    'LKG & UKG',
    'Comprehensive kindergarten program preparing children for primary school with academics, creativity, and character building.',
    'Ages 4 – 6 yrs',
    'kindergarten',
    '["Reading & writing readiness", "Numeracy & math concepts", "Science exploration", "Art, craft & outdoor activities", "School readiness skills"]'::jsonb,
    'Mon–Sat | 9:00 AM – 3:30 PM / 4:00 PM',
    '#b8d8f8',
    '📚',
    true
),
(
    'Afterschool Care',
    'Safe, supervised afterschool care with homework help, activities, and fun — giving working parents peace of mind.',
    'School-going kids',
    'daycare',
    '["Homework assistance", "Reading & activity time", "Healthy snacks", "Indoor & outdoor games", "Safe pickup & care"]'::jsonb,
    'Mon–Sat | Up to 4:00 PM',
    '#fff0b0',
    '🎒',
    true
),
(
    'Weekend Care',
    'Fun-filled weekend sessions with creative activities, games, and learning — giving parents a well-deserved break.',
    'All ages',
    'weekend',
    '["Creative arts & crafts", "Music & movement", "Group games & storytelling", "Structured fun activities", "Flexible weekend timings"]'::jsonb,
    'Weekends | Special Sessions',
    '#ffd8e4',
    '🌈',
    true
)
ON CONFLICT DO NOTHING;

-- 2. SEED TESTIMONIALS
INSERT INTO public.testimonials (parent_display_name, child_info, feedback, avatar, rating, published)
VALUES
(
    'Priya',
    'Mother of Aarav, 4',
    'Abhyudaya Preschool transformed my shy boy into a confident, curious child. The teachers are like second moms!',
    '👩‍💼',
    5,
    true
),
(
    'Meera',
    'Mother of Ananya, 3',
    'As a working parent, the caring environment and convenient 9:00 AM to 4:00 PM schedule gives me complete peace of mind. My daughter loves every moment here!',
    '👩',
    5,
    true
),
(
    'Sunita',
    'Mother of Rohan, 5',
    'The play-based learning approach is outstanding. Rohan learned to read, paint, and make friends — all through fun!',
    '👩‍🦱',
    5,
    true
)
ON CONFLICT DO NOTHING;

-- 3. SEED GALLERY
INSERT INTO public.gallery (title, description, image_url, category, emoji, published)
VALUES
(
    'Our Colourful Classroom',
    'Child-safe learning spaces designed for joyful curiosity',
    '/gallery1.jpg',
    'Classroom',
    '🏫',
    true
),
(
    'Fun Movement Activity',
    'Kids expressing rhythm and coordination through dance and music',
    '/gallery2.jpg',
    'Activities',
    '💃',
    true
),
(
    'Balloon Day Celebration',
    'Outdoor joyous festivities and laughter under open skies',
    '/gallery3.jpg',
    'Outdoor',
    '🎈',
    true
),
(
    'Morning Meditation',
    'Calm mindfulness and focus circle at the start of our day',
    '/gallery4.jpg',
    'Meditation',
    '🧘',
    true
),
(
    'Snack Time Together',
    'Healthy, nutritious snacks shared in a warm community circle',
    '/gallery5.jpg',
    'Mealtime',
    '🍱',
    true
)
ON CONFLICT DO NOTHING;

-- 4. SEED ANNOUNCEMENTS
INSERT INTO public.announcements (title, content, published)
VALUES
(
    '🌟 Admissions Open 2026–2027',
    'Admissions are now open for Daycare, Playgroup, Nursery, LKG, and UKG at our SS Nagar, Perumanallur campus. Visit us between 9:00 AM and 4:00 PM for campus tours.',
    true
),
(
    '🎒 Extended Daycare Timings Support Working Parents',
    'Full-day care and afterschool supervision available with nutritious meals, rest sessions, and guided learning from 9:00 AM to 4:00 PM.',
    true
)
ON CONFLICT DO NOTHING;

-- 5. SEED EVENTS
INSERT INTO public.events (title, description, event_date, published)
VALUES
(
    'Annual Sports & Play Day',
    'A day filled with games, races, and active celebrations for our little champions and their families.',
    CURRENT_DATE + INTERVAL '14 days',
    true
),
(
    'Open House & Campus Tour Weekend',
    'Join our founder Bharani S and educators to explore our classrooms, curriculum, and interactive play areas.',
    CURRENT_DATE + INTERVAL '21 days',
    true
)
ON CONFLICT DO NOTHING;
