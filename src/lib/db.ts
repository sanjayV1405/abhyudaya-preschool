import { supabase, isConfigured } from './supabase'
export { isConfigured }
import { createEnquiryApi, getPublicAnnouncementsApi } from './api'

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

// ── Enquiry submission (Hybrid MERN: MongoDB Atlas Ingestion) ─────────────────

export async function submitEnquiry(rawData: EnquirySubmission): Promise<SubmitResult> {
  const validationError = validateEnquiry(rawData)
  if (validationError) return { success: false, error: validationError }

  if (isRateLimited()) {
    return {
      success: false,
      error: 'Too many submissions. Please wait a moment before trying again.',
    }
  }

  // Construct validated and sanitized database payload
  const payload: EnquirySubmission = {
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

  // Primary Ingestion: Store in MongoDB Atlas via Express REST API
  const apiRes = await createEnquiryApi(payload)

  if (!apiRes.success) {
    console.error('[Enquiry] MongoDB API submission error:', apiRes.error)
    return {
      success: false,
      error: apiRes.error || 'We could not save your enquiry right now. Please call or WhatsApp us directly at +91 97887 13822.',
    }
  }

  return { success: true }
}

// ── Email notification for enquiries ──────────────────────────────────────────

export async function sendEnquiryEmail(data: {
  parent_name: string
  phone: string
  child_name?: string
  child_age?: string
  message?: string
  enquiry_type?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    console.warn('[Email] Supabase not configured, skipping email notification.')
    return { success: false, error: 'Email service not configured.' }
  }

  try {
    const { data: result, error } = await supabase.functions.invoke('send-enquiry-email', {
      body: {
        parent_name: data.parent_name,
        phone: data.phone,
        child_name: data.child_name || undefined,
        child_age: data.child_age || undefined,
        message: data.message || undefined,
        enquiry_type: data.enquiry_type || 'admission',
      },
    })

    if (error) {
      console.error('[Email] Edge function error:', error)
      return { success: false, error: 'Email notification failed.' }
    }

    console.info('[Email] Notification sent successfully:', result)
    return { success: true }
  } catch (err) {
    console.error('[Email] Unexpected error:', err)
    return { success: false, error: 'Email notification failed.' }
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
    title: 'LKG',
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
    title: 'After School',
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

export const GALLERY_CATEGORIES = [
  'Activities',
  'Classroom',
  'Outdoor Play',
  'Events & Celebrations',
  'Campus',
  'Daycare',
] as const

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Activities': '🎨',
  'Classroom': '🏫',
  'Outdoor Play': '⚽',
  'Events & Celebrations': '🎉',
  'Campus': '🏡',
  'Daycare': '🍼',
}

const LOCAL_GALLERY_STORAGE_KEY = 'abhyudaya_local_gallery_v2'

export function getLocalGallery(): GalleryRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as GalleryRecord[]
  } catch {
    return []
  }
}

export function saveLocalGallery(items: GalleryRecord[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_GALLERY_STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.warn('[LocalStorage] Could not persist gallery items:', e)
  }
}

export const DEFAULT_GALLERY: GalleryRecord[] = [
  // Classroom
  {
    id: 'seed-gal-1',
    title: 'Colourful & Child-Safe Classroom',
    category: 'Classroom',
    emoji: '🏫',
    description: 'Child-safe learning spaces designed for joyful curiosity, bright daylight and ergonomic furniture',
    image_url: '/gallery1.jpg',
    published: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'seed-gal-2',
    title: 'Montessori Materials & Puzzle Corner',
    category: 'Classroom',
    emoji: '🧩',
    description: 'Hands-on sensory, counting and cognitive learning materials arranged at child height',
    image_url: '/gallery4.jpg',
    published: true,
    created_at: '2026-03-01T01:00:00Z',
  },
  {
    id: 'seed-gal-3',
    title: 'Children Learning Spaces & Activity Tables',
    category: 'Classroom',
    emoji: '📐',
    description: 'Collaborative seating encouraging group exploration, creative discussion and fine motor practice',
    image_url: '/gallery5.jpg',
    published: true,
    created_at: '2026-03-01T02:00:00Z',
  },
  // Activities
  {
    id: 'seed-gal-4',
    title: 'Fun Movement & Rhyme Activities',
    category: 'Activities',
    emoji: '💃',
    description: 'Kids expressing rhythm, balance and coordination through lively dance, rhymes and music',
    image_url: '/gallery2.jpg',
    published: true,
    created_at: '2026-03-01T03:00:00Z',
  },
  {
    id: 'seed-gal-5',
    title: 'Art, Craft & Sensory Expression',
    category: 'Activities',
    emoji: '🎨',
    description: 'Colour mixing, finger painting, clay modelling and boundless artistic creativity',
    image_url: '/gallery5.jpg',
    published: true,
    created_at: '2026-03-01T04:00:00Z',
  },
  {
    id: 'seed-gal-6',
    title: 'Storytelling & Early Vocabulary Games',
    category: 'Activities',
    emoji: '📖',
    description: 'Interactive puppet shows and captivating picture books building early vocabulary',
    image_url: '/gallery1.jpg',
    published: true,
    created_at: '2026-03-01T05:00:00Z',
  },
  // Outdoor Play
  {
    id: 'seed-gal-7',
    title: 'Joyful Open-Air Playground Games',
    category: 'Outdoor Play',
    emoji: '🎈',
    description: 'Outdoor joyous festivities, tag games and active physical play under shaded open skies',
    image_url: '/gallery3.jpg',
    published: true,
    created_at: '2026-03-01T06:00:00Z',
  },
  {
    id: 'seed-gal-8',
    title: 'Sandbox Exploration & Nature Play',
    category: 'Outdoor Play',
    emoji: '⚽',
    description: 'Sensory gardening, tactile sand exploration and friendly outdoor teamwork',
    image_url: '/gallery2.jpg',
    published: true,
    created_at: '2026-03-01T07:00:00Z',
  },
  // Events & Celebrations
  {
    id: 'seed-gal-9',
    title: 'Festive Balloon Day & Colour Celebration',
    category: 'Events & Celebrations',
    emoji: '🎉',
    description: 'Vibrant cultural celebrations with colourful decorations, music and parent smiles',
    image_url: '/gallery3.jpg',
    published: true,
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 'seed-gal-10',
    title: 'Annual Day Kids Stage Performance',
    category: 'Events & Celebrations',
    emoji: '⭐',
    description: 'Confident little stars performing dances, rhymes and skits in custom costumes',
    image_url: '/gallery4.jpg',
    published: true,
    created_at: '2026-03-01T09:00:00Z',
  },
  // Campus
  {
    id: 'seed-gal-11',
    title: 'Welcoming SS Nagar Green Campus',
    category: 'Campus',
    emoji: '🏡',
    description: 'Safe, gated campus in SS Nagar Perumanallur with lush green surroundings and secure entry',
    image_url: '/gallery1.jpg',
    published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'seed-gal-12',
    title: 'Clean & Hygienic Play Environments',
    category: 'Campus',
    emoji: '✨',
    description: 'Daily sanitised premises, filtered water stations and child-height safety fittings',
    image_url: '/gallery5.jpg',
    published: true,
    created_at: '2026-03-01T11:00:00Z',
  },
  // Daycare
  {
    id: 'seed-gal-13',
    title: 'Peaceful Nap Room & Toddler Rest Haven',
    category: 'Daycare',
    emoji: '🍼',
    description: 'Soft bedding, calming ambient lighting and attentive caretakers for soothing sleep',
    image_url: '/gallery4.jpg',
    published: true,
    created_at: '2026-03-01T12:00:00Z',
  },
  {
    id: 'seed-gal-14',
    title: 'Nutritious Snack & Sharing Circle',
    category: 'Daycare',
    emoji: '🍱',
    description: 'Warm healthy meal times supervised with gentle manners, hygiene and joy',
    image_url: '/gallery5.jpg',
    published: true,
    created_at: '2026-03-01T13:00:00Z',
  },
]

export async function fetchGallery(): Promise<GalleryRecord[]> {
  const localItems = getLocalGallery()

  if (!supabase) {
    if (localItems.length > 0) {
      const localIds = new Set(localItems.map(i => i.id))
      return [...localItems, ...DEFAULT_GALLERY.filter(d => !localIds.has(d.id))]
    }
    return DEFAULT_GALLERY
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('gallery') as any)
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      if (localItems.length > 0) {
        const localIds = new Set(localItems.map(i => i.id))
        return [...localItems, ...DEFAULT_GALLERY.filter(d => !localIds.has(d.id))]
      }
      return DEFAULT_GALLERY
    }

    const remoteIds = new Set((data as GalleryRecord[]).map(d => d.id))
    const uniqueLocal = localItems.filter(l => !remoteIds.has(l.id))
    return [...uniqueLocal, ...(data as GalleryRecord[])]
  } catch (err) {
    console.error('[Gallery] Unexpected fetch error:', err)
    if (localItems.length > 0) {
      const localIds = new Set(localItems.map(i => i.id))
      return [...localItems, ...DEFAULT_GALLERY.filter(d => !localIds.has(d.id))]
    }
    return DEFAULT_GALLERY
  }
}

/**
 * Convert a File object to a base64 / Data URL with client-side compression
 * to ensure offline resilience and fast loads.
 */
export function fileToCompressedDataUrl(file: File, maxWidth = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      // If already small SVG or GIF or under 300KB, resolve directly
      if (file.type === 'image/gif' || file.size < 300 * 1024) {
        resolve(result)
        return
      }

      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(result)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(format, quality))
      }
      img.onerror = () => resolve(result)
      img.src = result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Upload an image file to the Supabase Storage 'gallery' bucket.
 * Falls back to client-side data URL if storage is offline or unconfigured.
 */
export async function uploadGalleryImage(file: File): Promise<{ url: string; error?: string }> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    return { url: '', error: 'Invalid file format. Please select a JPG, PNG, or WebP image.' }
  }

  const maxSize = 15 * 1024 * 1024 // 15 MB
  if (file.size > maxSize) {
    return { url: '', error: 'Image size exceeds the 15MB limit. Please choose a smaller file.' }
  }

  // If Supabase is available, try uploading to Storage bucket
  if (supabase) {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safeBase = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30)
      const filePath = `photos/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeBase}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath)
        if (urlData?.publicUrl) {
          return { url: urlData.publicUrl }
        }
      } else {
        console.warn('[Supabase Storage] Storage bucket upload failed, using high-quality local fallback:', uploadError.message)
      }
    } catch (err) {
      console.warn('[Supabase Storage] Exception uploading to storage, using fallback:', err)
    }
  }

  // Seamless fallback to compressed Data URL
  try {
    const dataUrl = await fileToCompressedDataUrl(file)
    return { url: dataUrl }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read image file'
    return { url: '', error: message }
  }
}

/**
 * Upload multiple images with optional progress reporting
 */
export async function uploadMultipleGalleryImages(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = []
  const errors: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const res = await uploadGalleryImage(file)
    if (res.url) {
      urls.push(res.url)
    } else {
      errors.push(`${file.name}: ${res.error || 'Failed to upload'}`)
    }
    if (onProgress) {
      onProgress(i + 1, files.length)
    }
  }

  return { urls, errors }
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
    title: '🌟 Admissions Open 2027–2028',
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
  // 1. Primary Source: Fetch live announcements from MongoDB Atlas
  try {
    const apiRes = await getPublicAnnouncementsApi()
    if (apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
      return apiRes.data
    }
  } catch (err) {
    console.warn('[Announcements] MongoDB API query error:', err)
  }

  // 2. Secondary / Historical Source: Fallback to Supabase so historical announcements remain visible
  if (!supabase) return DEFAULT_ANNOUNCEMENTS
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('announcements') as any)
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[Announcements] Supabase fetch error:', (error as { message: string }).message)
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

