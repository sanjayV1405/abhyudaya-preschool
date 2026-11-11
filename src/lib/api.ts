import { supabase } from './supabase'
import type { Enquiry, EnquirySubmission, EnquiryStatus, Announcement } from '../types/database'

// ── Environment & Base URL Configuration ──────────────────────────────────────
const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()

const isBrowser = typeof window !== 'undefined'
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

/**
 * Determine API base URL:
 * - If VITE_API_URL is explicitly configured, use it (trimmed).
 * - If running locally on localhost, default to 'http://localhost:5000/api'.
 * - In production on Firebase Hosting, NEVER default to localhost. This prevents Chrome
 *   from triggering the Private Network Access security popup:
 *   "wants to access other apps and services on this device".
 */
export const API_BASE = rawApiUrl
  ? rawApiUrl.replace(/\/+$/, '')
  : isLocalhost
    ? 'http://localhost:5000/api'
    : ''

export function isApiConfigured(): boolean {
  return Boolean(API_BASE && (isLocalhost || !API_BASE.includes('localhost')))
}

/**
 * Retrieve authorization headers using the current active Supabase session
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch (err) {
      console.warn('[API Auth] Failed to retrieve Supabase session token:', err)
    }
  }

  return headers
}

/**
 * Normalize MongoDB document fields to match the frontend's expected TypeScript interfaces
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEntity<T>(doc: any): T {
  if (!doc) return doc
  const normalized = { ...doc }

  if (doc._id && !doc.id) {
    normalized.id = typeof doc._id === 'string' ? doc._id : doc._id.toString()
  }

  if (doc.createdAt && !doc.created_at) {
    normalized.created_at = typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt.toISOString?.() || String(doc.createdAt)
  }

  return normalized as T
}

// ── Health Check ──────────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<{ ok: boolean; message?: string }> {
  if (!isApiConfigured()) {
    return { ok: false, message: 'API is not configured for this environment' }
  }
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = await res.json()
      return { ok: true, message: data.service }
    }
    return { ok: false, message: `HTTP ${res.status}` }
  } catch (err) {
    return { ok: false, message: (err as Error).message }
  }
}

// ── Enquiry & Admissions API (MongoDB) ────────────────────────────────────────

export async function createEnquiryApi(
  payload: EnquirySubmission
): Promise<{ success: boolean; data?: Enquiry; error?: string }> {
  if (!isApiConfigured()) {
    return {
      success: false,
      error: 'API endpoint is not configured for this environment.',
    }
  }
  try {
    const res = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to submit enquiry to server.',
      }
    }

    return { success: true, data: normalizeEntity<Enquiry>(data.data) }
  } catch (err) {
    console.error('[API] createEnquiry network error:', err)
    return {
      success: false,
      error: 'Could not connect to the admissions server. Please verify your internet connection or contact us via WhatsApp.',
    }
  }
}

export async function getEnquiriesApi(params?: {
  status?: string
  search?: string
}): Promise<{ success: boolean; data: Enquiry[]; error?: string }> {
  if (!isApiConfigured()) {
    return { success: false, data: [] }
  }
  try {
    const headers = await getAuthHeaders()
    const query = new URLSearchParams()
    if (params?.status && params.status !== 'all') query.set('status', params.status)
    if (params?.search) query.set('search', params.search)

    const url = `${API_BASE}/enquiries${query.toString() ? '?' + query.toString() : ''}`
    const res = await fetch(url, { method: 'GET', headers })
    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, data: [], error: data.error || 'Failed to fetch enquiries' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = (data.data || []).map((e: any) => normalizeEntity<Enquiry>(e))
    return { success: true, data: list }
  } catch (err) {
    console.error('[API] getEnquiries network error:', err)
    return { success: false, data: [], error: (err as Error).message }
  }
}

export async function updateEnquiryStatusApi(
  id: string,
  status: EnquiryStatus
): Promise<{ success: boolean; data?: Enquiry; error?: string }> {
  if (!isApiConfigured()) {
    return { success: false, error: 'API is not configured' }
  }
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/enquiries/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update enquiry status' }
    }

    return { success: true, data: normalizeEntity<Enquiry>(data.data) }
  } catch (err) {
    console.error('[API] updateEnquiryStatus network error:', err)
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteEnquiryApi(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isApiConfigured()) {
    return { success: false, error: 'API is not configured' }
  }
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/enquiries/${id}`, {
      method: 'DELETE',
      headers,
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to delete enquiry' }
    }

    return { success: true }
  } catch (err) {
    console.error('[API] deleteEnquiry network error:', err)
    return { success: false, error: (err as Error).message }
  }
}

// ── Announcements API (MongoDB) ───────────────────────────────────────────────

export async function getPublicAnnouncementsApi(): Promise<{
  success: boolean
  data: Announcement[]
  error?: string
}> {
  if (!isApiConfigured()) {
    return { success: false, data: [] }
  }
  try {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, data: [], error: data.error || 'Failed to fetch public announcements' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = (data.data || []).map((a: any) => normalizeEntity<Announcement>(a))
    return { success: true, data: list }
  } catch (err) {
    return { success: false, data: [], error: (err as Error).message }
  }
}

export async function getAdminAnnouncementsApi(): Promise<{
  success: boolean
  data: Announcement[]
  error?: string
}> {
  if (!isApiConfigured()) {
    return { success: false, data: [] }
  }
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/announcements/admin`, {
      method: 'GET',
      headers,
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, data: [], error: data.error || 'Failed to fetch admin announcements' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = (data.data || []).map((a: any) => normalizeEntity<Announcement>(a))
    return { success: true, data: list }
  } catch (err) {
    return { success: false, data: [], error: (err as Error).message }
  }
}

export async function createAnnouncementApi(
  payload: Partial<Announcement>
): Promise<{ success: boolean; data?: Announcement; error?: string }> {
  if (!isApiConfigured()) {
    return { success: false, error: 'API is not configured' }
  }
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to create announcement' }
    }

    return { success: true, data: normalizeEntity<Announcement>(data.data) }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateAnnouncementApi(
  id: string,
  payload: Partial<Announcement>
): Promise<{ success: boolean; data?: Announcement; error?: string }> {
  if (!isApiConfigured()) {
    return { success: false, error: 'API is not configured' }
  }
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update announcement' }
    }

    return { success: true, data: normalizeEntity<Announcement>(data.data) }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function toggleAnnouncementPublishedApi(
  id: string,
  published?: boolean
): Promise<{ success: boolean; data?: Announcement; error?: string }> {
  if (!isApiConfigured()) {
    return { success: false, error: 'API is not configured' }
  }
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/announcements/${id}/publish`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ published }),
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update published state' }
    }

    return { success: true, data: normalizeEntity<Announcement>(data.data) }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteAnnouncementApi(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isApiConfigured()) {
    return { success: false, error: 'API is not configured' }
  }
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'DELETE',
      headers,
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to delete announcement' }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

