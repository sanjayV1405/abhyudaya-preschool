import { supabase, isConfigured } from './supabase'
export { isConfigured }

import type {
  EnquirySubmission,
  GalleryRecord,
  TestimonialRecord,
  Program,
  Announcement,
  PreschoolEvent,
} from '../types/database'

// ── Validation helpers ───────────────────────────────────────────────────────

const PHONE_REGEX = /^[+]?[\d\s\-().]{7,15}$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export interface SubmitResult {
  success: boolean
  error?: string
}

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/[<>]/g, '')
}

function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim())
}

function sanitizeDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return DATE_REGEX.test(trimmed) ? trimmed : null
}

function validateEnquiry(data: EnquirySubmission): string | null {
  const name = sanitizeText(data.parent_name)
  if (name.length < 2) return 'Parent name must be at least 2 characters.'

  const phone = sanitizeText(data.phone)
  if (!PHONE_REGEX.test(phone)) return 'Please enter a valid phone number (7–15 digits).'

  if (data.email) {
    const email = sanitizeText(data.email)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
  }

  return null // valid
}

// ── Rate limiting (client-side guard — not a security substitute for RLS) ────

const submissionLog: number[] = []
const RATE_WINDOW_MS = 60_000 // 1 minute
const MAX_SUBMISSIONS = 3

function isRateLimited(): boolean {
  const now = Date.now()
  const recent = submissionLog.filter(t => now - t < RATE_WINDOW_MS)
  submissionLog.splice(0, submissionLog.length, ...recent)
  if (recent.length >= MAX_SUBMISSIONS) return true
  submissionLog.push(now)
  return false
}

// ── Enquiry submission ────────────────────────────────────────────────────────

export async function submitEnquiry(rawData: EnquirySubmission): Promise<SubmitResult> {
  const validationError = validateEnquiry(rawData)
  if (validationError) return { success: false, error: validationError }

  if (!supabase) {
    console.error('[Enquiry] Database client is not configured or Supabase keys are missing.')
    return {
      success: false,
      error: 'We could not save your enquiry right now. Please call or WhatsApp us directly at 97887 13822.',
    }
  }

  if (isRateLimited()) {
    return {
      success: false,
      error: 'Too many submissions. Please wait a moment before trying again.',
    }
  }

  // Construct validated and sanitized database payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {
    parent_name: sanitizeText(rawData.parent_name),
    phone: sanitizeText(rawData.phone),
    enquiry_type: rawData.enquiry_type ?? 'admission',
  }

  const email = sanitizeText(rawData.email)
  if (email) payload.email = email

  const childName = sanitizeText(rawData.child_name)
  if (childName) payload.child_name = childName

  const childAge = sanitizeText(rawData.child_age)
  if (childAge) payload.child_age = childAge

  if (rawData.program_id && isValidUuid(rawData.program_id)) {
    payload.program_id = rawData.program_id
  }

  const message = sanitizeText(rawData.message)
  if (message) payload.message = message.slice(0, 1000)

  const preferredDate = sanitizeDate(rawData.preferred_date)
  if (preferredDate) payload.preferred_date = preferredDate

  const preferredSlot = sanitizeText(rawData.preferred_slot)
  if (preferredSlot) payload.preferred_slot = preferredSlot

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('enquiries') as any).insert([payload])

    if (error) {
      console.error('[Enquiry] Insert error:', (error as { message: string }).message, error)
      return {
        success: false,
        error: 'We could not save your enquiry right now. Please call or WhatsApp us directly at 97887 13822.',
      }
    }

    return { success: true }
  } catch (err) {
    console.error('[Enquiry] Unexpected error:', err)
    return {
      success: false,
      error: 'We could not save your enquiry right now. Please call or WhatsApp us directly at 97887 13822.',
    }
  }
}

// ── Campus visit submission ───────────────────────────────────────────────────

export interface CampusVisitSubmission {
  parent_name: string
  phone: string
  preferred_date?: string
  preferred_slot?: string
  notes?: string
}

export async function submitCampusVisit(rawData: CampusVisitSubmission): Promise<SubmitResult> {
  return submitEnquiry({
    parent_name: rawData.parent_name,
    phone: rawData.phone,
    message: rawData.notes,
    enquiry_type: 'campus_visit',
    preferred_date: rawData.preferred_date,
    preferred_slot: rawData.preferred_slot,
  })
}

// ── Read public data ──────────────────────────────────────────────────────────

export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: 'prog-daycare',
    title: 'Daycare',
    category: 'daycare',
    age_group: '2+ years',
    icon: '🍼',
    color: '#ffd6b0',
    timings: 'Mon–Sat | 9:00 AM – 4:00 PM',
    description:
      'A safe and loving environment for toddlers 2 years and above. Supervised care, play, rest, and meals with gentle, attentive teachers.',
    features: [
      'Safe & supervised care',
      'Age-appropriate play',
      'Nutritious meals & snacks',
      'Rest & nap time',
      'Warm, home-like atmosphere',
    ],
    published: true,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'prog-playgroup',
    title: 'Playgroup',
    category: 'foundations',
    age_group: 'Ages 2 – 3 yrs',
    icon: '🎪',
    color: '#e0d0f8',
    timings: 'Mon–Sat | 9:00 AM – 12:30 PM / 4:00 PM',
    description:
      'A gentle first step into school life. Sensory play, rhymes, and social bonding in a cosy, home-like setting.',
    features: [
      'Sensory & tactile play',
      'Circle time & songs',
      'Basic motor skills',
      'Social bonding activities',
      'Toilet training support',
    ],
    published: true,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'prog-nursery',
    title: 'Nursery',
    category: 'foundations',
    age_group: 'Ages 3 – 4 yrs',
    icon: '🌱',
    color: '#b8f0d8',
    timings: 'Mon–Sat | 9:00 AM – 1:00 PM / 4:00 PM',
    description:
      'Building curiosity and creativity through structured play, early language skills, and joyful exploration.',
    features: [
      'Pre-reading & pre-writing',
      'Number concepts & math play',
      'Art, craft & music',
      'Storytelling sessions',
      'Social & emotional skills',
    ],
    published: true,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'prog-kindergarten',
    title: 'LKG & UKG',
    category: 'kindergarten',
    age_group: 'Ages 4 – 6 yrs',
    icon: '📚',
    color: '#b8d8f8',
    timings: 'Mon–Sat | 9:00 AM – 3:30 PM / 4:00 PM',
    description:
      'Comprehensive kindergarten program preparing children for primary school with academics, creativity, and character building.',
    features: [
      'Reading & writing readiness',
      'Numeracy & math concepts',
      'Science exploration',
      'Art, craft & outdoor activities',
      'School readiness skills',
    ],
    published: true,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'prog-afterschool',
    title: 'Afterschool Care',
    category: 'daycare',
    age_group: 'School-going kids',
    icon: '🎒',
    color: '#fff0b0',
    timings: 'Mon–Sat | Up to 4:00 PM',
    description:
      'Safe, supervised afterschool care with homework help, activities, and fun — giving working parents peace of mind.',
    features: [
      'Homework assistance',
      'Reading & activity time',
      'Healthy snacks',
      'Indoor & outdoor games',
      'Safe pickup & care',
    ],
    published: true,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'prog-weekend',
    title: 'Weekend Care',
    category: 'weekend',
    age_group: 'All ages',
    icon: '🌈',
    color: '#ffd8e4',
    timings: 'Weekends | Special Sessions',
    description:
      'Fun-filled weekend sessions with creative activities, games, and learning — giving parents a well-deserved break.',
    features: [
      'Creative arts & crafts',
      'Music & movement',
      'Group games & storytelling',
      'Structured fun activities',
      'Flexible weekend timings',
    ],
    published: true,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
]

export async function fetchPrograms(): Promise<Program[]> {
  if (!supabase) return DEFAULT_PROGRAMS
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('programs') as any)
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('[Programs] Fetch error:', (error as { message: string }).message)
      return DEFAULT_PROGRAMS
    }
    return ((data ?? []) as Program[]).map(p => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
    }))
  } catch (err) {
    console.error('[Programs] Unexpected fetch error:', err)
    return DEFAULT_PROGRAMS
  }
}

export const DEFAULT_TESTIMONIALS: TestimonialRecord[] = [
  {
    id: 'seed-test-1',
    parent_display_name: 'Priya',
    child_info: 'Mother of Aarav, 4',
    feedback:
      'Abhyudaya Preschool transformed my shy boy into a confident, curious child. The teachers are like second moms!',
    avatar: '👩‍💼',
    rating: 5,
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'seed-test-2',
    parent_display_name: 'Meera',
    child_info: 'Mother of Ananya, 3',
    feedback:
      'As a working parent, the caring environment and convenient 9:00 AM to 4:00 PM schedule gives me complete peace of mind. My daughter loves every moment here!',
    avatar: '👩',
    rating: 5,
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'seed-test-3',
    parent_display_name: 'Sunita',
    child_info: 'Mother of Rohan, 5',
    feedback:
      'The play-based learning approach is outstanding. Rohan learned to read, paint, and make friends — all through fun!',
    avatar: '👩‍🦱',
    rating: 5,
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
]

export async function fetchTestimonials(): Promise<TestimonialRecord[]> {
  if (!supabase) return DEFAULT_TESTIMONIALS
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('testimonials') as any)
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[Testimonials] Fetch error:', (error as { message: string }).message)
      return DEFAULT_TESTIMONIALS
    }
    return (data ?? []) as TestimonialRecord[]
  } catch (err) {
    console.error('[Testimonials] Unexpected fetch error:', err)
    return DEFAULT_TESTIMONIALS
  }
}

export const DEFAULT_GALLERY: GalleryRecord[] = [
  {
    id: 'seed-gal-1',
    title: 'Our Colourful Classroom',
    category: 'Classroom',
    emoji: '🏫',
    description: 'Child-safe learning spaces designed for joyful curiosity',
    image_url: '/gallery1.jpg',
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'seed-gal-2',
    title: 'Fun Movement Activity',
    category: 'Activities',
    emoji: '💃',
    description: 'Kids expressing rhythm and coordination through dance and music',
    image_url: '/gallery2.jpg',
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'seed-gal-3',
    title: 'Balloon Day Celebration',
    category: 'Outdoor',
    emoji: '🎈',
    description: 'Outdoor joyous festivities and laughter under open skies',
    image_url: '/gallery3.jpg',
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'seed-gal-4',
    title: 'Morning Meditation',
    category: 'Meditation',
    emoji: '🧘',
    description: 'Calm mindfulness and focus circle at the start of our day',
    image_url: '/gallery4.jpg',
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'seed-gal-5',
    title: 'Snack Time Together',
    category: 'Mealtime',
    emoji: '🍱',
    description: 'Healthy, nutritious snacks shared in a warm community circle',
    image_url: '/gallery5.jpg',
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
]

export async function fetchGallery(): Promise<GalleryRecord[]> {
  if (!supabase) return DEFAULT_GALLERY
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('gallery') as any)
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[Gallery] Fetch error:', (error as { message: string }).message)
      return DEFAULT_GALLERY
    }
    return (data ?? []) as GalleryRecord[]
  } catch (err) {
    console.error('[Gallery] Unexpected fetch error:', err)
    return DEFAULT_GALLERY
  }
}

/**
 * Upload an image file to the Supabase Storage 'gallery' bucket.
 * Restricts to JPG, PNG, WebP up to 5MB.
 */
export async function uploadGalleryImage(file: File): Promise<{ url: string; error?: string }> {
  if (!supabase) {
    return { url: '', error: 'Database is not connected. Please verify your Supabase configuration.' }
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return { url: '', error: 'Invalid file format. Please select a JPG, PNG, or WebP image.' }
  }

  const maxSize = 5 * 1024 * 1024 // 5 MB
  if (file.size > maxSize) {
    return { url: '', error: 'Image size exceeds the 5MB limit. Please choose a smaller file.' }
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeBase = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30)
    const filePath = `photos/${Date.now()}_${safeBase}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[Supabase Storage] Upload error:', uploadError)
      return { url: '', error: uploadError.message }
    }

    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath)
    if (!urlData?.publicUrl) {
      return { url: '', error: 'Could not obtain public URL for the uploaded photo.' }
    }

    return { url: urlData.publicUrl }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected upload error'
    console.error('[Supabase Storage] Unexpected error:', err)
    return { url: '', error: message }
  }
}

export function getFormattedFutureDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'seed-ann-1',
    title: '🌟 Admissions Open 2026–2027',
    content:
      'Admissions are now open for Daycare, Playgroup, Nursery, LKG, and UKG at our SS Nagar, Perumanallur campus. Visit us between 9:00 AM and 4:00 PM for campus tours.',
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'seed-ann-2',
    title: '🎒 Extended Daycare Timings Support Working Parents',
    content:
      'Full-day care and afterschool supervision available with nutritious meals, rest sessions, and guided learning from 9:00 AM to 4:00 PM.',
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
]

export const DEFAULT_EVENTS: PreschoolEvent[] = [
  {
    id: 'seed-evt-1',
    title: 'Annual Sports & Play Day',
    description:
      'A day filled with games, races, and active celebrations for our little champions and their families.',
    event_date: getFormattedFutureDate(14),
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'seed-evt-2',
    title: 'Open House & Campus Tour Weekend',
    description:
      'Join our founder Bharani S and educators to explore our classrooms, curriculum, and interactive play areas.',
    event_date: getFormattedFutureDate(21),
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
]

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (!supabase) return DEFAULT_ANNOUNCEMENTS
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('announcements') as any)
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[Announcements] Fetch error:', (error as { message: string }).message)
      return DEFAULT_ANNOUNCEMENTS
    }
    return (data ?? []) as Announcement[]
  } catch (err) {
    console.error('[Announcements] Unexpected fetch error:', err)
    return DEFAULT_ANNOUNCEMENTS
  }
}

export async function fetchEvents(): Promise<PreschoolEvent[]> {
  if (!supabase) return DEFAULT_EVENTS
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('events') as any)
      .select('*')
      .eq('published', true)
      .order('event_date', { ascending: true })
    if (error) {
      console.error('[Events] Fetch error:', (error as { message: string }).message)
      return DEFAULT_EVENTS
    }
    return (data ?? []) as PreschoolEvent[]
  } catch (err) {
    console.error('[Events] Unexpected fetch error:', err)
    return DEFAULT_EVENTS
  }
}

