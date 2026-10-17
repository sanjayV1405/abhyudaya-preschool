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

export interface SubmitResult {
  success: boolean
  error?: string
}

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/[<>]/g, '')
}

function validateEnquiry(data: EnquirySubmission): string | null {
  const name = sanitizeText(data.parent_name)
  if (name.length < 2) return 'Parent name must be at least 2 characters.'

  const phone = sanitizeText(data.phone)
  if (!PHONE_REGEX.test(phone)) return 'Please enter a valid phone number (7–15 digits).'

  if (data.email) {
    const email = sanitizeText(data.email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
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
    // Graceful offline fallback: store locally
    try {
      const existing = JSON.parse(localStorage.getItem('abhyudaya_local_enquiries') || '[]')
      existing.unshift({
        ...rawData,
        id: 'local_' + Date.now(),
        created_at: new Date().toISOString(),
      })
      localStorage.setItem('abhyudaya_local_enquiries', JSON.stringify(existing.slice(0, 100)))
    } catch {
      // ignore
    }
    return { success: true }
  }

  if (isRateLimited()) {
    return {
      success: false,
      error: 'Too many submissions. Please wait a moment before trying again.',
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {
    parent_name: sanitizeText(rawData.parent_name),
    phone: sanitizeText(rawData.phone),
    enquiry_type: rawData.enquiry_type ?? 'admission',
  }

  if (rawData.email) payload.email = sanitizeText(rawData.email)
  if (rawData.child_name) payload.child_name = sanitizeText(rawData.child_name)
  if (rawData.child_age) payload.child_age = sanitizeText(rawData.child_age)
  if (rawData.program_id) payload.program_id = rawData.program_id
  if (rawData.message) payload.message = sanitizeText(rawData.message).slice(0, 1000)
  if (rawData.preferred_date) payload.preferred_date = rawData.preferred_date
  if (rawData.preferred_slot) payload.preferred_slot = rawData.preferred_slot

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('enquiries') as any).insert([payload])

  if (error) {
    console.error('[Enquiry] Insert error:', (error as { message: string }).message)
    return {
      success: false,
      error: 'We could not save your enquiry right now. Please call or WhatsApp us directly at 97887 13822.',
    }
  }

  return { success: true }
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

export async function fetchPrograms(): Promise<Program[]> {
  if (!supabase) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('programs') as any)
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('[Programs] Fetch error:', (error as { message: string }).message)
    return []
  }
  // Normalize features from JSONB (Supabase returns it as parsed JS array already)
  return ((data ?? []) as Program[]).map(p => ({
    ...p,
    features: Array.isArray(p.features) ? p.features : [],
  }))
}

export async function fetchTestimonials(): Promise<TestimonialRecord[]> {
  if (!supabase) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('testimonials') as any)
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('[Testimonials] Fetch error:', (error as { message: string }).message)
    return []
  }
  return (data ?? []) as TestimonialRecord[]
}

export async function fetchGallery(): Promise<GalleryRecord[]> {
  if (!supabase) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('gallery') as any)
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('[Gallery] Fetch error:', (error as { message: string }).message)
    return []
  }
  return (data ?? []) as GalleryRecord[]
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (!supabase) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('announcements') as any)
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[Announcements] Fetch error:', (error as { message: string }).message)
    return []
  }
  return (data ?? []) as Announcement[]
}

export async function fetchEvents(): Promise<PreschoolEvent[]> {
  if (!supabase) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('events') as any)
    .select('*')
    .eq('published', true)
    .order('event_date', { ascending: true })
  if (error) {
    console.error('[Events] Fetch error:', (error as { message: string }).message)
    return []
  }
  return (data ?? []) as PreschoolEvent[]
}
