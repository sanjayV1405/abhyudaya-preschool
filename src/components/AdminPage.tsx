import { useState, useEffect, useMemo } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type {
  Enquiry,
  EnquiryStatus,
  Program,
  PreschoolEvent,
  Announcement,
  GalleryRecord,
  TestimonialRecord,
} from '../types/database'

// ── Authorized Administrators ─────────────────────────────────────────────────
//
// These 4 email accounts are authorized to access the Abhyudaya Preschool Admin Portal.
// Database access is securely protected by Supabase Row Level Security (RLS) policies
// using the PostgreSQL `public.is_admin()` function.
//
const AUTHORIZED_ADMIN_EMAILS = [
  'abhyudayapreschool@gmail.com',
  'jothisanjay659@gmail.com',
  'sreelakshmij67@gmail.com',
  'vkvsvishw91@gmail.com',
] as const

function isAuthorizedAdmin(user: { email?: string | null; app_metadata?: { role?: string } } | null): boolean {
  if (!user) return false
  if (user.app_metadata?.role === 'admin') return true
  const email = (user.email ?? '').trim().toLowerCase()
  return AUTHORIZED_ADMIN_EMAILS.some(e => e.toLowerCase() === email)
}

// ── Status Badges & Styles ───────────────────────────────────────────────────

const STATUS_STYLES: Record<EnquiryStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-300',
  contacted: 'bg-blue-100 text-blue-800 border border-blue-300',
  enrolled: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  closed: 'bg-gray-100 text-gray-600 border border-gray-300',
}

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  pending: '⏳ Pending',
  contacted: '📞 Contacted',
  enrolled: '🎓 Enrolled',
  closed: '🔒 Closed',
}

// ── Admin Auth Hook ──────────────────────────────────────────────────────────

function useAdminAuth() {
  const [user, setUser] = useState<{ email?: string | null; app_metadata?: { role?: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let isMounted = true

    // Safety timeout: Ensure loading never hangs indefinitely
    const timeoutId = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 2500)

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        const currentUser = data?.session?.user ?? null
        if (currentUser && !isAuthorizedAdmin(currentUser)) {
          supabase?.auth.signOut().catch(() => {})
          setUser(null)
          setAuthError(
            `Access denied: The account ${currentUser.email} is not an authorized administrator.`,
          )
        } else {
          setUser(currentUser)
        }
      })
      .catch(err => {
        console.warn('[useAdminAuth] Session check failed:', err)
      })
      .finally(() => {
        if (isMounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
      })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_ev, session) => {
      if (!isMounted) return
      const currentUser = session?.user ?? null
      if (currentUser && !isAuthorizedAdmin(currentUser)) {
        await supabase?.auth.signOut().catch(() => {})
        setUser(null)
        setAuthError(
          `Access denied: The account ${currentUser.email} is not an authorized administrator.`,
        )
      } else {
        setUser(currentUser)
        if (currentUser) setAuthError('')
      }
    })

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      listener?.subscription?.unsubscribe()
    }
  }, [])

  return { user, loading, authError, setAuthError }
}

// ── Admin Login Component ────────────────────────────────────────────────────

interface AdminLoginProps {
  onBackToSite?: () => void
  initialError?: string
}

function AdminLogin({ onBackToSite, initialError }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(initialError || '')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError('Please enter your administrator email.')
      return
    }

    if (!supabase) {
      setError('Database is not configured. Check your environment variables.')
      return
    }

    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (signInError) {
      setLoading(false)
      setError(signInError.message || 'Invalid email or password.')
      return
    }

    // Verify authorized administrator identity
    if (data.user && !isAuthorizedAdmin(data.user)) {
      await supabase.auth.signOut()
      setLoading(false)
      setError(
        `Access denied: Account (${cleanEmail}) is not in the approved school administrator list.`,
      )
      return
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(145deg, #f8f4ff 0%, #edf9f5 100%)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-[#e0d0f8] p-8 sm:p-10 w-full max-w-md relative overflow-hidden">
        {/* Top Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#5a3a8a] via-[#b48de8] to-[#10b981]" />

        {/* Back to site button */}
        {onBackToSite && (
          <button
            type="button"
            onClick={onBackToSite}
            className="text-xs font-bold text-[#6a5a7a] hover:text-[#5a3a8a] flex items-center gap-1.5 mb-6 transition-colors"
          >
            ← Back to Website
          </button>
        )}

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#f5efff] border border-[#e0d0f8] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
            🏫
          </div>
          <h1 className="text-2xl font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Admin Portal
          </h1>
          <p className="text-xs font-semibold text-[#8a7a9a] mt-1">
            Abhyudaya Preschool · Management Suite
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-start gap-2.5">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1">{error}</div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-700 text-xs font-bold leading-none"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5a4a6a] uppercase tracking-wider mb-1.5">
              Admin Email Address *
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. abhyudayapreschool@gmail.com"
              className="w-full px-4 py-3 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#5a3a8a] text-sm bg-[#fdfaff] transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#5a4a6a] uppercase tracking-wider">
                Password *
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#5a3a8a] text-sm bg-[#fdfaff] pr-12 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8a7a9a] hover:text-[#5a3a8a] px-1 py-1 rounded transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide 👁️' : 'Show 👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#5a3a8a] text-white rounded-xl font-black text-sm shadow-md hover:bg-[#4a2a7a] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all mt-2"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">⏳</span> Verifying credentials…
              </>
            ) : (
              <span>Sign In to Dashboard →</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#f0e8f8] text-center">
          <p className="text-xs text-[#8a7a9a] leading-relaxed">
            🛡️ Access is strictly limited to authorized school staff with valid Supabase Auth credentials.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Admin Dashboard Component ────────────────────────────────────────────────

type AdminTab = 'overview' | 'enquiries' | 'programs' | 'events' | 'announcements' | 'gallery' | 'testimonials'

interface AdminDashboardProps {
  userEmail?: string | null
  onBackToSite?: () => void
}

function AdminDashboard({ userEmail, onBackToSite }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // Data states
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [events, setEvents] = useState<PreschoolEvent[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [gallery, setGallery] = useState<GalleryRecord[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialRecord[]>([])

  const [loading, setLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Enquiry filters & search
  const [enquiryFilter, setEnquiryFilter] = useState<EnquiryStatus | 'all'>('all')
  const [enquirySearch, setEnquirySearch] = useState('')
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)

  // Testimonial filter
  const [testimonialFilter, setTestimonialFilter] = useState<'all' | 'published' | 'pending'>('all')

  // Modals for Create/Edit
  const [programModal, setProgramModal] = useState<{ open: boolean; data?: Partial<Program> }>({ open: false })
  const [eventModal, setEventModal] = useState<{ open: boolean; data?: Partial<PreschoolEvent> }>({ open: false })
  const [announcementModal, setAnnouncementModal] = useState<{ open: boolean; data?: Partial<Announcement> }>({ open: false })
  const [galleryModal, setGalleryModal] = useState<{ open: boolean; data?: Partial<GalleryRecord> }>({ open: false })
  const [testimonialModal, setTestimonialModal] = useState<{ open: boolean; data?: Partial<TestimonialRecord> }>({ open: false })

  useEffect(() => {
    fetchAllData()
  }, [])

  function showNotification(msg: string) {
    setActionMessage(msg)
    setTimeout(() => setActionMessage(null), 4500)
  }

  function showError(msg: string) {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 6000)
  }

  async function fetchAllData() {
    if (!supabase) return
    setLoading(true)
    try {
      const [enqRes, progRes, evtRes, annRes, galRes, tstRes] = await Promise.all([
        supabase.from('enquiries').select('*').order('created_at', { ascending: false }),
        supabase.from('programs').select('*').order('created_at', { ascending: true }),
        supabase.from('events').select('*').order('event_date', { ascending: true }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('gallery').select('*').order('created_at', { ascending: false }),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
      ])

      if (enqRes.error) console.error('Enquiries fetch error:', enqRes.error)
      if (progRes.error) console.error('Programs fetch error:', progRes.error)

      setEnquiries((enqRes.data ?? []) as Enquiry[])
      setPrograms((progRes.data ?? []) as Program[])
      setEvents((evtRes.data ?? []) as PreschoolEvent[])
      setAnnouncements((annRes.data ?? []) as Announcement[])
      setGallery((galRes.data ?? []) as GalleryRecord[])
      setTestimonials((tstRes.data ?? []) as TestimonialRecord[])
    } catch (err) {
      console.error('Fetch error:', err)
      showError('Failed to fetch data from Supabase. Ensure database tables exist.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/admin/login')
    }
  }

  // ── Enquiry Actions ────────────────────────────────────────────────────────

  async function updateEnquiryStatus(id: string, status: EnquiryStatus) {
    if (!supabase) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('enquiries') as any).update({ status }).eq('id', id)
    if (error) {
      showError('Failed to update status: ' + error.message)
    } else {
      setEnquiries(prev => prev.map(e => (e.id === id ? { ...e, status } : e)))
      showNotification(`Enquiry status updated to "${status}".`)
    }
  }

  async function deleteEnquiry(id: string) {
    if (!confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) return
    if (!supabase) return
    const { error } = await supabase.from('enquiries').delete().eq('id', id)
    if (error) {
      showError('Failed to delete enquiry: ' + error.message)
    } else {
      setEnquiries(prev => prev.filter(e => e.id !== id))
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null)
      showNotification('Enquiry deleted.')
    }
  }

  function openWhatsApp(enq: Enquiry) {
    const parent = enq.parent_name || 'Parent'
    const child = enq.child_name ? ` for ${enq.child_name}` : ''
    const msg = `Hello ${parent}! 👋 Greetings from Abhyudaya Preschool, Perumanallur.
Thank you for your enquiry regarding admissions${child}. We would love to assist you and answer any questions about our daycare, playgroup, nursery, or kindergarten programs.`
    const cleanPhone = enq.phone.replace(/[^\d+]/g, '')
    const fullPhone = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ── Testimonial Actions (Approval & Publishing) ─────────────────────────────

  async function toggleTestimonialPublished(item: TestimonialRecord) {
    if (!supabase) {
      showError('Database is not connected. Please verify your Supabase configuration.')
      return
    }
    const newStatus = !item.published
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('testimonials') as any)
      .update({ published: newStatus })
      .eq('id', item.id)

    if (error) {
      showError('Failed to update testimonial: ' + error.message)
    } else {
      setTestimonials(prev => prev.map(t => (t.id === item.id ? { ...t, published: newStatus } : t)))
      showNotification(
        newStatus
          ? `Approved and published testimonial from "${item.parent_display_name}".`
          : `Unpublished testimonial from "${item.parent_display_name}".`,
      )
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('preschool-content-updated'))
      }
      fetchAllData()
    }
  }

  async function saveTestimonial(data: Partial<TestimonialRecord>) {
    if (!supabase) {
      showError('Database is not connected. Please verify your Supabase configuration.')
      return
    }
    const parentName = data.parent_display_name?.trim()
    const feedback = data.feedback?.trim()
    if (!parentName || !feedback) {
      showError('Parent name and feedback are required.')
      return
    }

    const payload = {
      parent_display_name: parentName,
      feedback,
      child_info: data.child_info?.trim() || null,
      avatar: data.avatar?.trim() || '👩‍💼',
      rating: typeof data.rating === 'number' ? Math.max(1, Math.min(5, data.rating)) : 5,
      published: Boolean(data.published),
    }

    if (data.id) {
      // Edit
      const { error } = await supabase.from('testimonials').update(payload).eq('id', data.id)
      if (error) {
        showError('Failed to update testimonial: ' + error.message)
      } else {
        showNotification('Testimonial updated.')
        setTestimonialModal({ open: false })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('preschool-content-updated'))
        }
        fetchAllData()
      }
    } else {
      // Insert
      const { error } = await supabase.from('testimonials').insert([payload])
      if (error) {
        showError('Failed to add testimonial: ' + error.message)
      } else {
        showNotification('New testimonial added.')
        setTestimonialModal({ open: false })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('preschool-content-updated'))
        }
        fetchAllData()
      }
    }
  }

  async function deleteTestimonial(id: string) {
    if (!confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) return
    if (!supabase) {
      showError('Database is not connected.')
      return
    }
    const { error } = await supabase.from('testimonials').delete().eq('id', id)
    if (error) {
      showError('Failed to delete testimonial: ' + error.message)
    } else {
      setTestimonials(prev => prev.filter(t => t.id !== id))
      showNotification('Testimonial deleted.')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('preschool-content-updated'))
      }
      fetchAllData()
    }
  }

  // ── Programs Actions ────────────────────────────────────────────────────────

  async function toggleProgramPublished(prog: Program) {
    if (!supabase) return
    const newStatus = !prog.published
    const { error } = await supabase.from('programs').update({ published: newStatus }).eq('id', prog.id)
    if (error) showError(error.message)
    else {
      setPrograms(prev => prev.map(p => (p.id === prog.id ? { ...p, published: newStatus } : p)))
      showNotification(`Program "${prog.title}" is now ${newStatus ? 'published' : 'draft'}.`)
    }
  }

  async function saveProgram(data: Partial<Program>) {
    if (!supabase) return
    if (!data.title || !data.description || !data.age_group) {
      alert('Title, age group, and description are required.')
      return
    }

    if (data.id) {
      const { error } = await supabase.from('programs').update(data).eq('id', data.id)
      if (error) showError(error.message)
      else {
        showNotification('Program updated.')
        setProgramModal({ open: false })
        fetchAllData()
      }
    } else {
      const { error } = await supabase.from('programs').insert([data])
      if (error) showError(error.message)
      else {
        showNotification('Program added.')
        setProgramModal({ open: false })
        fetchAllData()
      }
    }
  }

  async function deleteProgram(id: string) {
    if (!confirm('Delete this program?')) return
    if (!supabase) return
    const { error } = await supabase.from('programs').delete().eq('id', id)
    if (error) showError(error.message)
    else {
      setPrograms(prev => prev.filter(p => p.id !== id))
      showNotification('Program deleted.')
    }
  }

  // ── Events Actions ──────────────────────────────────────────────────────────

  async function toggleEventPublished(evt: PreschoolEvent) {
    if (!supabase) {
      showError('Database is not connected. Please verify your Supabase configuration.')
      return
    }
    const newStatus = !evt.published
    const { error } = await supabase.from('events').update({ published: newStatus }).eq('id', evt.id)
    if (error) {
      showError('Failed to update event: ' + error.message)
    } else {
      setEvents(prev => prev.map(e => (e.id === evt.id ? { ...e, published: newStatus } : e)))
      showNotification(`Event "${evt.title}" is now ${newStatus ? 'published' : 'draft'}.`)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('preschool-content-updated'))
      }
    }
  }

  async function saveEvent(data: Partial<PreschoolEvent>) {
    if (!supabase) {
      showError('Database is not connected. Please verify your Supabase configuration.')
      return
    }
    const title = data.title?.trim()
    const eventDate = data.event_date?.trim()
    if (!title || !eventDate) {
      showError('Event title and date are required.')
      return
    }

    const payload = {
      title,
      event_date: eventDate,
      description: data.description?.trim() || null,
      image_url: data.image_url?.trim() || null,
      published: Boolean(data.published),
    }

    if (data.id) {
      const { error } = await supabase.from('events').update(payload).eq('id', data.id)
      if (error) {
        showError('Failed to update event: ' + error.message)
      } else {
        showNotification('Event updated successfully.')
        setEventModal({ open: false })
        await fetchAllData()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('preschool-content-updated'))
        }
      }
    } else {
      const { error } = await supabase.from('events').insert([payload])
      if (error) {
        showError('Failed to create event: ' + error.message)
      } else {
        showNotification('Event created successfully.')
        setEventModal({ open: false })
        await fetchAllData()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('preschool-content-updated'))
        }
      }
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return
    if (!supabase) {
      showError('Database is not connected.')
      return
    }
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      showError('Failed to delete event: ' + error.message)
    } else {
      setEvents(prev => prev.filter(e => e.id !== id))
      showNotification('Event deleted successfully.')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('preschool-content-updated'))
      }
    }
  }

  // ── Announcements Actions ───────────────────────────────────────────────────

  async function toggleAnnouncementPublished(ann: Announcement) {
    if (!supabase) {
      showError('Database is not connected. Please verify your Supabase configuration.')
      return
    }
    const newStatus = !ann.published
    const { error } = await supabase.from('announcements').update({ published: newStatus }).eq('id', ann.id)
    if (error) {
      showError('Failed to update announcement: ' + error.message)
    } else {
      setAnnouncements(prev => prev.map(a => (a.id === ann.id ? { ...a, published: newStatus } : a)))
      showNotification(`Announcement "${ann.title}" is now ${newStatus ? 'published' : 'draft'}.`)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('preschool-content-updated'))
      }
    }
  }

  async function saveAnnouncement(data: Partial<Announcement>) {
    if (!supabase) {
      showError('Database is not connected. Please verify your Supabase configuration.')
      return
    }
    const title = data.title?.trim()
    const content = data.content?.trim()
    if (!title || !content) {
      showError('Announcement title and content are required.')
      return
    }

    const payload = {
      title,
      content,
      published: Boolean(data.published),
    }

    if (data.id) {
      const { error } = await supabase.from('announcements').update(payload).eq('id', data.id)
      if (error) {
        showError('Failed to update announcement: ' + error.message)
      } else {
        showNotification('Announcement updated successfully.')
        setAnnouncementModal({ open: false })
        await fetchAllData()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('preschool-content-updated'))
        }
      }
    } else {
      const { error } = await supabase.from('announcements').insert([payload])
      if (error) {
        showError('Failed to post announcement: ' + error.message)
      } else {
        showNotification('Announcement posted successfully.')
        setAnnouncementModal({ open: false })
        await fetchAllData()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('preschool-content-updated'))
        }
      }
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) return
    if (!supabase) {
      showError('Database is not connected.')
      return
    }
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) {
      showError('Failed to delete announcement: ' + error.message)
    } else {
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      showNotification('Announcement deleted successfully.')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('preschool-content-updated'))
      }
    }
  }

  // ── Gallery Actions ─────────────────────────────────────────────────────────

  async function toggleGalleryPublished(item: GalleryRecord) {
    if (!supabase) return
    const newStatus = !item.published
    const { error } = await supabase.from('gallery').update({ published: newStatus }).eq('id', item.id)
    if (error) showError(error.message)
    else {
      setGallery(prev => prev.map(g => (g.id === item.id ? { ...g, published: newStatus } : g)))
      showNotification(`Gallery item "${item.title}" is now ${newStatus ? 'published' : 'draft'}.`)
    }
  }

  async function saveGallery(data: Partial<GalleryRecord>) {
    if (!supabase) return
    if (!data.title || !data.image_url) {
      alert('Gallery title and image URL are required.')
      return
    }

    if (data.id) {
      const { error } = await supabase.from('gallery').update(data).eq('id', data.id)
      if (error) showError(error.message)
      else {
        showNotification('Gallery item updated.')
        setGalleryModal({ open: false })
        fetchAllData()
      }
    } else {
      const { error } = await supabase.from('gallery').insert([data])
      if (error) showError(error.message)
      else {
        showNotification('Gallery item added.')
        setGalleryModal({ open: false })
        fetchAllData()
      }
    }
  }

  async function deleteGallery(id: string) {
    if (!confirm('Delete this gallery item?')) return
    if (!supabase) return
    const { error } = await supabase.from('gallery').delete().eq('id', id)
    if (error) showError(error.message)
    else {
      setGallery(prev => prev.filter(g => g.id !== id))
      showNotification('Gallery item deleted.')
    }
  }

  // ── Filtered Enquiries ─────────────────────────────────────────────────────

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(enq => {
      const matchesFilter = enquiryFilter === 'all' || enq.status === enquiryFilter
      const search = enquirySearch.trim().toLowerCase()
      if (!search) return matchesFilter
      const matchesSearch =
        enq.parent_name.toLowerCase().includes(search) ||
        (enq.child_name && enq.child_name.toLowerCase().includes(search)) ||
        enq.phone.includes(search) ||
        (enq.message && enq.message.toLowerCase().includes(search))
      return matchesFilter && matchesSearch
    })
  }, [enquiries, enquiryFilter, enquirySearch])

  // Counts
  const enquiryCounts = {
    all: enquiries.length,
    pending: enquiries.filter(e => e.status === 'pending').length,
    contacted: enquiries.filter(e => e.status === 'contacted').length,
    enrolled: enquiries.filter(e => e.status === 'enrolled').length,
    closed: enquiries.filter(e => e.status === 'closed').length,
  }

  const unapprovedTestimonialsCount = testimonials.filter(t => !t.published).length

  return (
    <div className="min-h-screen bg-[#f8f6fc] text-[#3d2a50]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header className="bg-[#241335] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <span className="text-xl sm:text-2xl shrink-0" aria-hidden="true">🏫</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-black text-sm sm:text-base tracking-wide truncate max-w-[150px] min-[400px]:max-w-[200px] sm:max-w-none" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Abhyudaya Preschool
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase shrink-0 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Admin Portal
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#b8a8c8] truncate mt-0.5">
                Logged in as: <span className="text-white font-medium">{userEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {onBackToSite && (
              <button
                type="button"
                onClick={onBackToSite}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-[#c8b8dc] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 shrink-0"
                title="Return to the public preschool website"
              >
                <span>🌐</span>
                <span className="hidden min-[480px]:inline">Back to Website</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/30 transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="border-t border-white/10 bg-[#1e0f2d] relative">
          <div
            role="tablist"
            aria-label="Dashboard Sections"
            className="max-w-7xl mx-auto px-2 sm:px-6 overflow-x-auto flex gap-1 py-1.5 scrollbar-thin"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'enquiries', label: 'Enquiries', icon: '📋', badge: enquiryCounts.pending },
              { id: 'programs', label: 'Programs', icon: '🎒', badge: programs.length },
              { id: 'events', label: 'Events', icon: '📅', badge: events.length },
              { id: 'announcements', label: 'Announcements', icon: '📢', badge: announcements.filter(a => a.published).length },
              { id: 'gallery', label: 'Gallery', icon: '📸' },
              { id: 'testimonials', label: 'Testimonials', icon: '⭐', badge: unapprovedTestimonialsCount, badgeColor: 'bg-amber-400 text-amber-900' },
            ].map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={`admin-tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`min-h-[40px] py-2 px-3 sm:px-4 text-xs font-bold whitespace-nowrap transition-all rounded-lg flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-white font-extrabold border-b-2 border-[#b48de8]'
                      : 'text-[#c8b8dc] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${tab.badgeColor || 'bg-[#b48de8] text-white'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* ── Toast Notifications ────────────────────────────────────────────── */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#241335] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 text-xs font-bold flex items-center gap-2.5 animate-bounce">
          <span className="text-emerald-400 text-sm">✅</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-red-500 text-xs font-bold flex items-center gap-2.5">
          <span className="text-red-300 text-sm">⚠️</span>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 underline text-[11px]">
            dismiss
          </button>
        </div>
      )}

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3 animate-pulse">⏳</div>
            <p className="text-xs font-bold text-[#8a7a9a]">Loading preschool database…</p>
          </div>
        ) : (
          <>
            {/* ── Tab: Overview ────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#e8dff5] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#8a7a9a] uppercase tracking-wider">Total Enquiries</span>
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="text-3xl font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {enquiryCounts.all}
                    </div>
                    <p className="text-xs text-[#8a7a9a] mt-1">All-time admissions &amp; visits</p>
                  </div>

                  <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-amber-200 bg-gradient-to-br from-white to-amber-50/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Action</span>
                      <span className="text-2xl">⏳</span>
                    </div>
                    <div className="text-3xl font-black text-amber-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {enquiryCounts.pending}
                    </div>
                    <p className="text-xs text-amber-800/80 mt-1">Requires school contact</p>
                  </div>

                  <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#e8dff5]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#8a7a9a] uppercase tracking-wider">Active Programs</span>
                      <span className="text-2xl">🎒</span>
                    </div>
                    <div className="text-3xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {programs.filter(p => p.published).length}{' '}
                      <span className="text-xs font-normal text-[#8a7a9a]">/ {programs.length}</span>
                    </div>
                    <p className="text-xs text-[#8a7a9a] mt-1">Daycare &amp; curriculum tracks</p>
                  </div>

                  <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#e8dff5]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#8a7a9a] uppercase tracking-wider">Upcoming Events</span>
                      <span className="text-2xl">📅</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {events.filter(e => e.published).length}
                    </div>
                    <p className="text-xs text-[#8a7a9a] mt-1">Published school events</p>
                  </div>
                </div>

                {/* Quick Actions & Pending Attention */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Quick Action buttons */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#e8dff5] space-y-4">
                    <h2 className="text-sm font-black text-[#3d2a50] uppercase tracking-wider">
                      ⚡ Quick Management
                    </h2>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setActiveTab('enquiries')}
                        className="p-3 rounded-2xl bg-[#f5efff] text-[#5a3a8a] hover:bg-[#ede0fc] text-xs font-bold text-left transition-colors flex flex-col gap-1 border border-[#e0d0f8]"
                      >
                        <span className="text-xl">📋</span>
                        <span>Manage Enquiries</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('testimonials')}
                        className="p-3 rounded-2xl bg-[#fff9ea] text-amber-900 hover:bg-[#fef3d6] text-xs font-bold text-left transition-colors flex flex-col gap-1 border border-amber-200"
                      >
                        <span className="text-xl">⭐</span>
                        <span>Approve Reviews ({unapprovedTestimonialsCount})</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('announcements')
                          setAnnouncementModal({ open: true })
                        }}
                        className="p-3 rounded-2xl bg-[#eefaf6] text-emerald-900 hover:bg-[#dcf4ec] text-xs font-bold text-left transition-colors flex flex-col gap-1 border border-emerald-200"
                      >
                        <span className="text-xl">📢</span>
                        <span>New Announcement</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('events')
                          setEventModal({ open: true })
                        }}
                        className="p-3 rounded-2xl bg-[#eef6ff] text-blue-900 hover:bg-[#deeeff] text-xs font-bold text-left transition-colors flex flex-col gap-1 border border-blue-200"
                      >
                        <span className="text-xl">📅</span>
                        <span>Schedule Event</span>
                      </button>
                    </div>

                    <div className="pt-2 text-xs text-[#8a7a9a] leading-relaxed border-t border-[#f0e8f8]">
                      🔒 Real-time synchronization directly with Supabase PostgreSQL tables.
                    </div>
                  </div>

                  {/* Latest Pending Enquiries Preview */}
                  <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-[#e8dff5]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-black text-[#3d2a50] uppercase tracking-wider">
                          Recent Submissions Needing Follow-up
                        </h2>
                        <p className="text-xs text-[#8a7a9a]">Parents awaiting a phone call or WhatsApp response</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('enquiries')}
                        className="text-xs font-bold text-[#5a3a8a] hover:underline"
                      >
                        View all →
                      </button>
                    </div>

                    {enquiries.filter(e => e.status === 'pending').length === 0 ? (
                      <div className="py-10 text-center text-xs text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
                        🎉 All enquiries have been contacted or addressed!
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {enquiries
                          .filter(e => e.status === 'pending')
                          .slice(0, 4)
                          .map(enq => (
                            <div
                              key={enq.id}
                              className="p-3.5 rounded-2xl border border-[#f0e8f8] bg-[#fdfaff] hover:bg-[#faf5ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                            >
                              <div>
                                <div className="font-bold text-xs text-[#3d2a50]">
                                  {enq.parent_name} · <span className="text-[#5a3a8a]">{enq.phone}</span>
                                </div>
                                <div className="text-[11px] text-[#8a7a9a] mt-0.5">
                                  {enq.child_name ? `Child: ${enq.child_name} | ` : ''}
                                  {enq.child_age || 'Admission Enquiry'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openWhatsApp(enq)}
                                  className="px-2.5 py-1 bg-[#25D366] text-white rounded-lg text-xs font-bold hover:bg-[#20ba5a] transition-all flex items-center gap-1 shadow-sm"
                                  title="Open WhatsApp chat with parent"
                                >
                                  <span>💬</span> WhatsApp
                                </button>
                                <button
                                  onClick={() => updateEnquiryStatus(enq.id, 'contacted')}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                >
                                  Mark Contacted
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Enquiries ───────────────────────────────────────────── */}
            {activeTab === 'enquiries' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#e8dff5] overflow-hidden">
                {/* Search & Filter Toolbar */}
                <div className="p-5 sm:p-6 border-b border-[#f0e8f8] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        Admissions &amp; Campus Visit Enquiries
                      </h2>
                      <p className="text-xs text-[#8a7a9a] mt-0.5">
                        Manage submitted leads, update statuses, and message parents directly
                      </p>
                    </div>

                    <button
                      onClick={fetchAllData}
                      className="px-3.5 py-1.5 rounded-xl border border-[#e0d0f8] text-xs font-bold text-[#5a3a8a] hover:bg-[#f5efff] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span>🔄</span> Refresh Leads
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Status filters */}
                    <div className="flex gap-1.5 flex-wrap">
                      {(['all', 'pending', 'contacted', 'enrolled', 'closed'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setEnquiryFilter(s)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                            enquiryFilter === s
                              ? 'bg-[#5a3a8a] text-white shadow-sm'
                              : 'bg-[#f4effc] text-[#5a3a8a] hover:bg-[#ebe0f8]'
                          }`}
                        >
                          {s} ({enquiryCounts[s]})
                        </button>
                      ))}
                    </div>

                    {/* Search box */}
                    <div className="relative">
                      <input
                        type="text"
                        value={enquirySearch}
                        onChange={e => setEnquirySearch(e.target.value)}
                        placeholder="Search parent, child, phone..."
                        className="w-full md:w-64 px-3.5 py-1.5 pl-8 rounded-xl border border-[#e0d0f8] text-xs focus:outline-none focus:ring-2 focus:ring-[#5a3a8a] bg-[#fdfaff]"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8a7a9a]">🔍</span>
                      {enquirySearch && (
                        <button
                          onClick={() => setEnquirySearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8a7a9a] hover:text-[#3d2a50]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table */}
                {filteredEnquiries.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[#8a7a9a]">
                    <div className="text-3xl mb-2">📭</div>
                    No enquiries match the selected filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#faf6ff] text-[#7a6a8a] border-b border-[#f0e8f8]">
                          <th className="px-5 py-3 font-black uppercase tracking-wider whitespace-nowrap">Date</th>
                          <th className="px-5 py-3 font-black uppercase tracking-wider">Parent Details</th>
                          <th className="px-5 py-3 font-black uppercase tracking-wider">Child / Age</th>
                          <th className="px-5 py-3 font-black uppercase tracking-wider">Type</th>
                          <th className="px-5 py-3 font-black uppercase tracking-wider">Message</th>
                          <th className="px-5 py-3 font-black uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3 font-black uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f5efff]">
                        {filteredEnquiries.map(enq => (
                          <tr key={enq.id} className="hover:bg-[#fcfaff] transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap text-[#8a7a9a]">
                              {new Date(enq.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: '2-digit',
                              })}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-[#3d2a50]">{enq.parent_name}</div>
                              <div className="text-[#5a3a8a] font-medium">
                                <a href={`tel:${enq.phone}`} className="hover:underline">
                                  {enq.phone}
                                </a>
                              </div>
                              {enq.email && <div className="text-[11px] text-[#8a7a9a]">{enq.email}</div>}
                            </td>
                            <td className="px-5 py-3.5">
                              {enq.child_name && <div className="font-bold text-[#3d2a50]">{enq.child_name}</div>}
                              <div className="text-[#8a7a9a]">{enq.child_age || '—'}</div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f5efff] text-[#5a3a8a] uppercase">
                                {enq.enquiry_type.replace('_', ' ')}
                              </span>
                              {enq.preferred_date && (
                                <div className="text-[10px] text-[#8a7a9a] mt-0.5">
                                  {enq.preferred_date} {enq.preferred_slot ? `· ${enq.preferred_slot}` : ''}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3.5 max-w-xs">
                              {enq.message ? (
                                <div className="line-clamp-2 text-[#6a5a7a]" title={enq.message}>
                                  {enq.message}
                                </div>
                              ) : (
                                <span className="text-[#c0b0d0] italic">None</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <select
                                value={enq.status}
                                onChange={e => updateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5a3a8a] ${
                                  STATUS_STYLES[enq.status]
                                }`}
                              >
                                <option value="pending">⏳ Pending</option>
                                <option value="contacted">📞 Contacted</option>
                                <option value="enrolled">🎓 Enrolled</option>
                                <option value="closed">🔒 Closed</option>
                              </select>
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                              <button
                                onClick={() => openWhatsApp(enq)}
                                className="px-2.5 py-1 bg-[#25D366] text-white rounded-lg text-xs font-bold hover:bg-[#20ba5a] transition-all inline-flex items-center gap-1 shadow-sm"
                                title="Chat with parent on WhatsApp"
                              >
                                💬
                              </button>
                              <button
                                onClick={() => setSelectedEnquiry(enq)}
                                className="px-2 py-1 bg-[#f0e8f8] text-[#5a3a8a] rounded-lg text-xs font-bold hover:bg-[#e0d0f8] transition-colors"
                                title="View complete enquiry details"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => deleteEnquiry(enq.id)}
                                className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                title="Delete enquiry record"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Programs ────────────────────────────────────────────── */}
            {activeTab === 'programs' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#e8dff5] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0e8f8]">
                  <div>
                    <h2 className="text-lg font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Preschool Programs &amp; Daycare
                    </h2>
                    <p className="text-xs text-[#8a7a9a] mt-0.5">
                      Configure age groups, schedules, curriculum features, and website visibility
                    </p>
                  </div>
                  <button
                    onClick={() => setProgramModal({ open: true })}
                    className="px-4 py-2 bg-[#5a3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#4a2a7a] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>➕</span> Add Program
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.map(prog => (
                    <div
                      key={prog.id}
                      className="rounded-2xl border border-[#e8dff5] p-5 bg-[#fdfaff] flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl p-2 rounded-xl bg-white border border-[#f0e8f8] shadow-inner">
                            {prog.icon || '🎒'}
                          </span>
                          <button
                            onClick={() => toggleProgramPublished(prog)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                              prog.published
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}
                          >
                            {prog.published ? '✅ Published' : '🔒 Draft'}
                          </button>
                        </div>
                        <h3 className="font-black text-sm text-[#3d2a50]">{prog.title}</h3>
                        <p className="text-xs font-bold text-[#5a3a8a] mt-0.5">{prog.age_group}</p>
                        <p className="text-xs text-[#6a5a7a] mt-2 line-clamp-3 leading-relaxed">
                          {prog.description}
                        </p>
                        {prog.timings && (
                          <div className="mt-3 text-[11px] font-semibold text-[#8a7a9a] flex items-center gap-1">
                            <span>🕒</span> {prog.timings}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#f0e8f8] flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#8a7a9a] uppercase">
                          {prog.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setProgramModal({ open: true, data: prog })}
                            className="px-2.5 py-1 bg-[#f0e8f8] text-[#5a3a8a] rounded-lg text-xs font-bold hover:bg-[#e0d0f8] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProgram(prog.id)}
                            className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab: Events ──────────────────────────────────────────────── */}
            {activeTab === 'events' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#e8dff5] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0e8f8]">
                  <div>
                    <h2 className="text-lg font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      School Events &amp; Celebrations
                    </h2>
                    <p className="text-xs text-[#8a7a9a] mt-0.5">
                      Schedule sports days, parent open houses, and cultural festivities
                    </p>
                  </div>
                  <button
                    onClick={() => setEventModal({ open: true })}
                    className="px-4 py-2 bg-[#5a3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#4a2a7a] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>➕</span> Add Event
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map(evt => (
                    <div
                      key={evt.id}
                      className="rounded-2xl border border-[#e8dff5] p-5 bg-[#fdfaff] flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-[#5a3a8a] bg-[#f5efff] px-2.5 py-1 rounded-lg">
                            📅 {evt.event_date}
                          </span>
                          <button
                            onClick={() => toggleEventPublished(evt)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                              evt.published
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}
                          >
                            {evt.published ? '✅ Published' : '🔒 Draft'}
                          </button>
                        </div>
                        <h3 className="font-black text-sm text-[#3d2a50] mt-2">{evt.title}</h3>
                        <p className="text-xs text-[#6a5a7a] mt-1.5 leading-relaxed">
                          {evt.description || <span className="italic text-[#c0b0d0]">No description provided</span>}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#f0e8f8] flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEventModal({ open: true, data: evt })}
                          className="px-2.5 py-1 bg-[#f0e8f8] text-[#5a3a8a] rounded-lg text-xs font-bold hover:bg-[#e0d0f8] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEvent(evt.id)}
                          className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab: Announcements ───────────────────────────────────────── */}
            {activeTab === 'announcements' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#e8dff5] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0e8f8]">
                  <div>
                    <h2 className="text-lg font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      School Announcements &amp; Notice Board
                    </h2>
                    <p className="text-xs text-[#8a7a9a] mt-0.5">
                      Broadcast admissions deadlines, holiday schedules, and important notices
                    </p>
                  </div>
                  <button
                    onClick={() => setAnnouncementModal({ open: true })}
                    className="px-4 py-2 bg-[#5a3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#4a2a7a] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>➕</span> Add Announcement
                  </button>
                </div>

                <div className="space-y-3">
                  {announcements.map(ann => (
                    <div
                      key={ann.id}
                      className="p-5 rounded-2xl border border-[#e8dff5] bg-[#fdfaff] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-1 max-w-3xl">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-[#3d2a50]">{ann.title}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              ann.published ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {ann.published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-xs text-[#6a5a7a] leading-relaxed">{ann.content}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center whitespace-nowrap">
                        <button
                          onClick={() => toggleAnnouncementPublished(ann)}
                          className="px-3 py-1 bg-white border border-[#e0d0f8] text-[#5a3a8a] rounded-lg text-xs font-bold hover:bg-[#f5efff] transition-colors"
                        >
                          {ann.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => setAnnouncementModal({ open: true, data: ann })}
                          className="px-2.5 py-1 bg-[#f0e8f8] text-[#5a3a8a] rounded-lg text-xs font-bold hover:bg-[#e0d0f8] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(ann.id)}
                          className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab: Gallery ─────────────────────────────────────────────── */}
            {activeTab === 'gallery' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#e8dff5] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0e8f8]">
                  <div>
                    <h2 className="text-lg font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Campus &amp; Activity Gallery
                    </h2>
                    <p className="text-xs text-[#8a7a9a] mt-0.5">
                      Showcase classroom spaces, play activities, outdoor games, and celebrations
                    </p>
                  </div>
                  <button
                    onClick={() => setGalleryModal({ open: true })}
                    className="px-4 py-2 bg-[#5a3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#4a2a7a] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>➕</span> Add Gallery Item
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map(item => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#e8dff5] overflow-hidden bg-[#fdfaff] shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-[#f0e8f8] overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={e => {
                            ;(e.target as HTMLImageElement).src = '/gallery1.jpg'
                          }}
                        />
                        <button
                          onClick={() => toggleGalleryPublished(item)}
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm ${
                            item.published
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-800/80 text-white'
                          }`}
                        >
                          {item.published ? 'Live' : 'Hidden'}
                        </button>
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                          {item.emoji || '📸'} {item.category}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-2">
                        <h4 className="font-bold text-xs text-[#3d2a50] line-clamp-1">{item.title}</h4>
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#f0e8f8]">
                          <button
                            onClick={() => setGalleryModal({ open: true, data: item })}
                            className="px-2 py-0.5 bg-[#f0e8f8] text-[#5a3a8a] rounded text-[11px] font-bold hover:bg-[#e0d0f8]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteGallery(item.id)}
                            className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[11px] font-bold hover:bg-red-100"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab: Testimonials (Approval & Publishing) ────────────────── */}
            {activeTab === 'testimonials' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#e8dff5] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0e8f8]">
                  <div>
                    <h2 className="text-lg font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Parent Testimonials &amp; Approvals
                    </h2>
                    <p className="text-xs text-[#8a7a9a] mt-0.5">
                      Review, verify, and approve genuine parent feedback before publishing live on the website
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTestimonialModal({ open: true })}
                      className="px-4 py-2 bg-[#5a3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#4a2a7a] transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span>➕</span> Add Testimonial
                    </button>
                  </div>
                </div>

                {/* Filter pills */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTestimonialFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      testimonialFilter === 'all'
                        ? 'bg-[#5a3a8a] text-white'
                        : 'bg-[#f5efff] text-[#5a3a8a] hover:bg-[#ebe0f8]'
                    }`}
                  >
                    All ({testimonials.length})
                  </button>
                  <button
                    onClick={() => setTestimonialFilter('published')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      testimonialFilter === 'published'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Published Live ({testimonials.filter(t => t.published).length})
                  </button>
                  <button
                    onClick={() => setTestimonialFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      testimonialFilter === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    Pending Approval ({unapprovedTestimonialsCount})
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testimonials
                    .filter(t => {
                      if (testimonialFilter === 'published') return t.published
                      if (testimonialFilter === 'pending') return !t.published
                      return true
                    })
                    .map(item => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all shadow-sm ${
                          item.published
                            ? 'bg-white border-emerald-200'
                            : 'bg-[#fffdfa] border-amber-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl p-1.5 rounded-xl bg-[#f5efff] border border-[#e0d0f8]">
                                {item.avatar || '👩‍💼'}
                              </span>
                              <div>
                                <h4 className="font-bold text-xs text-[#3d2a50]">{item.parent_display_name}</h4>
                                <p className="text-[11px] text-[#8a7a9a]">{item.child_info || 'Parent'}</p>
                              </div>
                            </div>

                            <span className="text-amber-500 text-xs tracking-wider">
                              {'★'.repeat(item.rating || 5)}
                            </span>
                          </div>

                          <p className="text-xs text-[#6a5a7a] leading-relaxed italic">
                            "{item.feedback}"
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#f0e8f8] flex items-center justify-between gap-2">
                          <button
                            onClick={() => toggleTestimonialPublished(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 ${
                              item.published
                                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {item.published ? '🔒 Unpublish' : '✅ Approve & Publish'}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setTestimonialModal({ open: true, data: item })}
                              className="px-2 py-1 bg-[#f0e8f8] text-[#5a3a8a] rounded-lg text-xs font-bold hover:bg-[#e0d0f8]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTestimonial(item.id)}
                              className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Enquiry Details Modal ──────────────────────────────────────────── */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e0d0f8] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0e8f8] pb-3">
              <h3 className="font-black text-sm text-[#3d2a50]">Enquiry Details</h3>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-xs font-bold text-[#8a7a9a] hover:text-[#3d2a50]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#fdfaff] p-3 rounded-2xl border border-[#f0e8f8]">
                <div>
                  <span className="text-[#8a7a9a] font-bold block">Parent:</span>
                  <span className="font-bold text-[#3d2a50]">{selectedEnquiry.parent_name}</span>
                </div>
                <div>
                  <span className="text-[#8a7a9a] font-bold block">Phone:</span>
                  <a href={`tel:${selectedEnquiry.phone}`} className="font-bold text-[#5a3a8a] hover:underline">
                    {selectedEnquiry.phone}
                  </a>
                </div>
                <div>
                  <span className="text-[#8a7a9a] font-bold block">Child's Name:</span>
                  <span>{selectedEnquiry.child_name || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[#8a7a9a] font-bold block">Program / Age:</span>
                  <span>{selectedEnquiry.child_age || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[#8a7a9a] font-bold block">Enquiry Type:</span>
                  <span className="capitalize">{selectedEnquiry.enquiry_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[#8a7a9a] font-bold block">Preferred Date/Slot:</span>
                  <span>{selectedEnquiry.preferred_date ? `${selectedEnquiry.preferred_date} (${selectedEnquiry.preferred_slot || 'Flexible'})` : 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-[#8a7a9a] font-bold block mb-1">Parent Message:</span>
                <div className="p-3 bg-[#fcf9ff] border border-[#f0e8f8] rounded-2xl text-[#6a5a7a] leading-relaxed">
                  {selectedEnquiry.message || 'No written message provided.'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#f0e8f8]">
              <button
                onClick={() => openWhatsApp(selectedEnquiry)}
                className="px-4 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#20ba5a] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>💬</span> Reply on WhatsApp
              </button>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 bg-[#f0e8f8] text-[#5a3a8a] rounded-xl text-xs font-bold hover:bg-[#e0d0f8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Testimonial Modal ──────────────────────────────────────────────── */}
      {testimonialModal.open && (
        <TestimonialEditorModal
          initialData={testimonialModal.data}
          onClose={() => setTestimonialModal({ open: false })}
          onSave={saveTestimonial}
        />
      )}

      {/* ── Program Modal ──────────────────────────────────────────────────── */}
      {programModal.open && (
        <ProgramEditorModal
          initialData={programModal.data}
          onClose={() => setProgramModal({ open: false })}
          onSave={saveProgram}
        />
      )}

      {/* ── Event Modal ────────────────────────────────────────────────────── */}
      {eventModal.open && (
        <EventEditorModal
          initialData={eventModal.data}
          onClose={() => setEventModal({ open: false })}
          onSave={saveEvent}
        />
      )}

      {/* ── Announcement Modal ─────────────────────────────────────────────── */}
      {announcementModal.open && (
        <AnnouncementEditorModal
          initialData={announcementModal.data}
          onClose={() => setAnnouncementModal({ open: false })}
          onSave={saveAnnouncement}
        />
      )}

      {/* ── Gallery Modal ──────────────────────────────────────────────────── */}
      {galleryModal.open && (
        <GalleryEditorModal
          initialData={galleryModal.data}
          onClose={() => setGalleryModal({ open: false })}
          onSave={saveGallery}
        />
      )}
    </div>
  )
}

// ── Modals / Forms ───────────────────────────────────────────────────────────

function TestimonialEditorModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Partial<TestimonialRecord>
  onClose: () => void
  onSave: (data: Partial<TestimonialRecord>) => void
}) {
  const [form, setForm] = useState({
    parent_display_name: initialData?.parent_display_name || '',
    child_info: initialData?.child_info || '',
    rating: initialData?.rating || 5,
    feedback: initialData?.feedback || '',
    avatar: initialData?.avatar || '👩‍💼',
    published: initialData?.published ?? false,
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e0d0f8] space-y-4">
        <h3 className="font-black text-sm text-[#3d2a50]">
          {initialData?.id ? 'Edit Testimonial' : 'Add Genuine Parent Testimonial'}
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Parent Name *</label>
            <input
              required
              value={form.parent_display_name}
              onChange={e => setForm({ ...form, parent_display_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="e.g. Priya"
            />
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Child Information</label>
            <input
              value={form.child_info}
              onChange={e => setForm({ ...form, child_info: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="e.g. Mother of Aarav, 4"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#8a7a9a] block mb-1">Rating (1 to 5 Stars)</label>
              <select
                value={form.rating}
                onChange={e => setForm({ ...form, rating: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                <option value={3}>⭐⭐⭐ (3/5)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[#8a7a9a] block mb-1">Avatar Emoji</label>
              <input
                value={form.avatar}
                onChange={e => setForm({ ...form, avatar: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
                placeholder="👩‍💼"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Parent Feedback / Review *</label>
            <textarea
              required
              rows={4}
              value={form.feedback}
              onChange={e => setForm({ ...form, feedback: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="Write genuine parent review..."
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pub-check"
              checked={form.published}
              onChange={e => setForm({ ...form, published: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="pub-check" className="font-bold text-[#3d2a50]">
              Approve &amp; Publish live to website
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-[#8a7a9a] hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...initialData, ...form })}
            className="px-4 py-1.5 text-xs font-bold bg-[#5a3a8a] text-white rounded-xl hover:bg-[#4a2a7a]"
          >
            Save Testimonial
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgramEditorModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Partial<Program>
  onClose: () => void
  onSave: (data: Partial<Program>) => void
}) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    age_group: initialData?.age_group || '',
    category: initialData?.category || 'foundations',
    description: initialData?.description || '',
    timings: initialData?.timings || 'Mon–Sat | 9:00 AM – 4:00 PM',
    icon: initialData?.icon || '🎒',
    featuresText: Array.isArray(initialData?.features) ? initialData.features.join('\n') : '',
    published: initialData?.published ?? true,
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e0d0f8] space-y-4">
        <h3 className="font-black text-sm text-[#3d2a50]">
          {initialData?.id ? 'Edit Program' : 'Add New Program'}
        </h3>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#8a7a9a] block mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
                placeholder="e.g. Daycare"
              />
            </div>
            <div>
              <label className="font-bold text-[#8a7a9a] block mb-1">Age Group *</label>
              <input
                required
                value={form.age_group}
                onChange={e => setForm({ ...form, age_group: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
                placeholder="e.g. 2+ years"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#8a7a9a] block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              >
                <option value="foundations">Foundations (Playgroup/Nursery)</option>
                <option value="daycare">Daycare &amp; Afterschool</option>
                <option value="kindergarten">Kindergarten (LKG &amp; UKG)</option>
                <option value="weekend">Weekend Care</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[#8a7a9a] block mb-1">Icon Emoji</label>
              <input
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
                placeholder="🎒"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Timings</label>
            <input
              value={form.timings}
              onChange={e => setForm({ ...form, timings: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="Mon–Sat | 9:00 AM – 4:00 PM"
            />
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="Brief overview of curriculum and goals..."
            />
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Features (One per line)</label>
            <textarea
              rows={3}
              value={form.featuresText}
              onChange={e => setForm({ ...form, featuresText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="Safe & supervised care&#10;Nutritious snacks&#10;Social play"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="prog-check"
              checked={form.published}
              onChange={e => setForm({ ...form, published: e.target.checked })}
            />
            <label htmlFor="prog-check" className="font-bold text-[#3d2a50]">
              Published live on website
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-[#8a7a9a] hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                ...initialData,
                title: form.title,
                age_group: form.age_group,
                category: form.category,
                description: form.description,
                timings: form.timings,
                icon: form.icon,
                features: form.featuresText
                  .split('\n')
                  .map(s => s.trim())
                  .filter(Boolean),
                published: form.published,
              })
            }
            className="px-4 py-1.5 text-xs font-bold bg-[#5a3a8a] text-white rounded-xl hover:bg-[#4a2a7a]"
          >
            Save Program
          </button>
        </div>
      </div>
    </div>
  )
}

function EventEditorModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Partial<PreschoolEvent>
  onClose: () => void
  onSave: (data: Partial<PreschoolEvent>) => void
}) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    event_date: initialData?.event_date || new Date().toISOString().split('T')[0],
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    published: initialData?.published ?? true,
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e0d0f8] space-y-4">
        <h3 className="font-black text-sm text-[#3d2a50]">
          {initialData?.id ? 'Edit Event' : 'Add New Event'}
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Event Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="e.g. Annual Sports & Play Day"
            />
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Event Date *</label>
            <input
              type="date"
              required
              value={form.event_date}
              onChange={e => setForm({ ...form, event_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
            />
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="Details about games, timings, and activities..."
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="evt-check"
              checked={form.published}
              onChange={e => setForm({ ...form, published: e.target.checked })}
            />
            <label htmlFor="evt-check" className="font-bold text-[#3d2a50]">
              Published live on website
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-[#8a7a9a] hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...initialData, ...form })}
            className="px-4 py-1.5 text-xs font-bold bg-[#5a3a8a] text-white rounded-xl hover:bg-[#4a2a7a]"
          >
            Save Event
          </button>
        </div>
      </div>
    </div>
  )
}

function AnnouncementEditorModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Partial<Announcement>
  onClose: () => void
  onSave: (data: Partial<Announcement>) => void
}) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    published: initialData?.published ?? true,
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e0d0f8] space-y-4">
        <h3 className="font-black text-sm text-[#3d2a50]">
          {initialData?.id ? 'Edit Announcement' : 'Add Announcement'}
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="e.g. 🌟 Admissions Open 2026–2027"
            />
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Announcement Content *</label>
            <textarea
              required
              rows={4}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="Admissions notice details..."
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ann-check"
              checked={form.published}
              onChange={e => setForm({ ...form, published: e.target.checked })}
            />
            <label htmlFor="ann-check" className="font-bold text-[#3d2a50]">
              Published live on notice board
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-[#8a7a9a] hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...initialData, ...form })}
            className="px-4 py-1.5 text-xs font-bold bg-[#5a3a8a] text-white rounded-xl hover:bg-[#4a2a7a]"
          >
            Save Announcement
          </button>
        </div>
      </div>
    </div>
  )
}

function GalleryEditorModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Partial<GalleryRecord>
  onClose: () => void
  onSave: (data: Partial<GalleryRecord>) => void
}) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    image_url: initialData?.image_url || '/gallery1.jpg',
    category: initialData?.category || 'Classroom',
    emoji: initialData?.emoji || '📸',
    description: initialData?.description || '',
    published: initialData?.published ?? true,
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e0d0f8] space-y-4">
        <h3 className="font-black text-sm text-[#3d2a50]">
          {initialData?.id ? 'Edit Gallery Photo' : 'Add Photo to Gallery'}
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="e.g. Colourful Playroom"
            />
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Image URL or Local Asset *</label>
            <input
              required
              value={form.image_url}
              onChange={e => setForm({ ...form, image_url: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="/gallery1.jpg or https://..."
            />
            <div className="flex gap-2 mt-1.5 text-[10px] text-[#8a7a9a]">
              <span>Presets:</span>
              {['/gallery1.jpg', '/gallery2.jpg', '/gallery3.jpg', '/gallery4.jpg', '/gallery5.jpg'].map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setForm({ ...form, image_url: preset })}
                  className="underline hover:text-[#5a3a8a]"
                >
                  {preset.replace('/', '')}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#8a7a9a] block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              >
                <option value="Classroom">Classroom</option>
                <option value="Activities">Activities</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Meditation">Meditation</option>
                <option value="Mealtime">Mealtime</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[#8a7a9a] block mb-1">Emoji</label>
              <input
                value={form.emoji}
                onChange={e => setForm({ ...form, emoji: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
                placeholder="🏫"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-[#8a7a9a] block mb-1">Description</label>
            <input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#e0d0f8]"
              placeholder="Short photo caption..."
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="gal-check"
              checked={form.published}
              onChange={e => setForm({ ...form, published: e.target.checked })}
            />
            <label htmlFor="gal-check" className="font-bold text-[#3d2a50]">
              Published live on website gallery
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-[#8a7a9a] hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...initialData, ...form })}
            className="px-4 py-1.5 text-xs font-bold bg-[#5a3a8a] text-white rounded-xl hover:bg-[#4a2a7a]"
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Default Export: Page Entry Point ─────────────────────────────────────────

interface AdminPageProps {
  onBackToSite?: () => void
}

export default function AdminPage({ onBackToSite }: AdminPageProps) {
  const { user, loading, authError } = useAdminAuth()

  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      if (!user || !isAuthorizedAdmin(user)) {
        if (window.location.pathname !== '/admin/login') {
          window.history.replaceState(null, '', '/admin/login')
        }
      } else {
        if (window.location.pathname === '/admin/login') {
          window.history.replaceState(null, '', '/admin')
        }
      }
    }
  }, [user, loading])

  if (!isConfigured) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(145deg, #f8f4ff 0%, #edf9f5 100%)' }}
      >
        <div className="bg-white rounded-3xl shadow-xl border border-[#e0d0f8] p-10 max-w-md text-center">
          <div className="text-5xl mb-4">⚙️</div>
          <h1 className="text-xl font-black text-[#5a3a8a] mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Database Not Configured
          </h1>
          <p className="text-xs text-[#6a5a7a] leading-relaxed">
            Please add your Supabase URL and Publishable Key to your environment variables to enable the Admin Portal.
          </p>
          {onBackToSite && (
            <button
              onClick={onBackToSite}
              className="mt-6 px-4 py-2 bg-[#5a3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#4a2a7a]"
            >
              ← Back to Website
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6fc]">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p className="text-xs font-bold text-[#8a7a9a]">Verifying administrator session…</p>
        </div>
      </div>
    )
  }

  if (!user || !isAuthorizedAdmin(user)) {
    return <AdminLogin onBackToSite={onBackToSite} initialError={authError} />
  }

  return <AdminDashboard userEmail={user.email} onBackToSite={onBackToSite} />
}

