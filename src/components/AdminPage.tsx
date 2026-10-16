import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { Enquiry, EnquiryStatus } from '../types/database'

// ── Auth Helper ──────────────────────────────────────────────────────────────

function useAdminAuth() {
  const [user, setUser] = useState<{ email?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// ── Login Form ───────────────────────────────────────────────────────────────

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!supabase) {
      setError('Supabase not configured. Check your .env.local file.')
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) setError(authError.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #f5f0fd 0%, #e8f5f0 100%)' }}>
      <div className="bg-white rounded-3xl shadow-xl border border-[#e0d0f8] p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Admin Login
          </h1>
          <p className="text-sm text-[#7a6a8a] mt-1">Abhyudaya Preschool — Management Portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5a4a6a] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@abhyudayapreschool.com"
              className="w-full px-4 py-3 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5a4a6a] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#5a3a8a] text-white rounded-xl font-black text-sm shadow-md hover:bg-[#4a2a7a] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '⏳ Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="text-center text-xs text-[#9a88a8] mt-6">
          Admin access requires a Supabase Auth account configured by the developer.<br />
          Contact: <a href="mailto:abhyudayapreschool@gmail.com" className="text-[#5a3a8a] hover:underline">abhyudayapreschool@gmail.com</a>
        </p>
      </div>
    </div>
  )
}

// ── Enquiry Status Badge ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<EnquiryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  enrolled: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  pending: '🕐 Pending',
  contacted: '📞 Contacted',
  enrolled: '✅ Enrolled',
  closed: '🔒 Closed',
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function AdminDashboard({ userEmail }: { userEmail?: string | null }) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<EnquiryStatus | 'all'>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEnquiries()
  }, [])

  async function fetchEnquiries() {
    if (!supabase) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('enquiries') as any)
      .select('*')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      setError('Failed to load enquiries: ' + (error as { message: string }).message)
    } else {
      setEnquiries((data ?? []) as Enquiry[])
    }
  }

  async function updateStatus(id: string, status: EnquiryStatus) {
    if (!supabase) return
    setUpdating(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('enquiries') as any)
      .update({ status })
      .eq('id', id)
    setUpdating(null)
    if (error) {
      setError('Failed to update: ' + (error as { message: string }).message)
    } else {
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    }
  }

  async function handleSignOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const filtered = filter === 'all' ? enquiries : enquiries.filter(e => e.status === filter)

  const counts = {
    all: enquiries.length,
    pending: enquiries.filter(e => e.status === 'pending').length,
    contacted: enquiries.filter(e => e.status === 'contacted').length,
    enrolled: enquiries.filter(e => e.status === 'enrolled').length,
    closed: enquiries.filter(e => e.status === 'closed').length,
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f5f0fd 0%, #e8f5f0 100%)' }}>
      {/* Header */}
      <header className="bg-[#2d1a40] text-white py-4 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏫</span>
          <div>
            <h1 className="font-black text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>Abhyudaya Admin</h1>
            <p className="text-xs text-[#c0b0d0]">Management Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#c0b0d0] hidden sm:block">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="px-4 py-1.5 bg-[#4a3060] hover:bg-[#5a4070] rounded-full text-xs font-bold transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Enquiries', value: counts.all, color: '#e0d0f8', icon: '📋' },
            { label: 'Pending', value: counts.pending, color: '#fef3c7', icon: '🕐' },
            { label: 'Contacted', value: counts.contacted, color: '#dbeafe', icon: '📞' },
            { label: 'Enrolled', value: counts.enrolled, color: '#d1fae5', icon: '✅' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-white/80" style={{ backgroundColor: stat.color + '60' }}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>{stat.value}</div>
              <div className="text-xs text-[#6a5a7a] font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Enquiries Panel */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#f0e8f8]">
          {/* Toolbar */}
          <div className="p-6 border-b border-[#f0e8f8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>Admission Enquiries</h2>
              <p className="text-xs text-[#9a88a8] mt-0.5">Manage and update enquiry statuses</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'contacted', 'enrolled', 'closed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${filter === s ? 'bg-[#5a3a8a] text-white' : 'bg-[#f0e8f8] text-[#5a3a8a] hover:bg-[#e0d0f8]'}`}
                >
                  {s} ({counts[s as keyof typeof counts]})
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              ⚠️ {error}
              <button className="ml-2 underline" onClick={() => setError('')}>dismiss</button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3 animate-pulse">⏳</div>
              <p className="text-[#9a88a8] text-sm">Loading enquiries…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-[#9a88a8] text-sm">No {filter !== 'all' ? filter : ''} enquiries yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#faf6ff]">
                    {['Date', 'Parent', 'Phone', 'Child / Program', 'Type', 'Message', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-black text-[#7a6a8a] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((enq, i) => (
                    <tr key={enq.id} className={`border-t border-[#f5f0fa] hover:bg-[#fdfaff] transition-colors ${i % 2 === 0 ? '' : 'bg-[#fefcff]'}`}>
                      <td className="px-5 py-4 text-xs text-[#9a88a8] whitespace-nowrap">
                        {new Date(enq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#3d2a50] text-sm">{enq.parent_name}</div>
                        {enq.email && <div className="text-xs text-[#9a88a8] break-all">{enq.email}</div>}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#5a4a6a] whitespace-nowrap">
                        <a href={`tel:${enq.phone}`} className="hover:text-[#5a3a8a] hover:underline">{enq.phone}</a>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#5a4a6a] max-w-[140px]">
                        {enq.child_name && <div className="font-bold">{enq.child_name}</div>}
                        {enq.child_age && <div className="text-[#9a88a8]">{enq.child_age}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#f0e8f8] text-[#5a3a8a] capitalize">
                          {enq.enquiry_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#6a5a7a] max-w-[180px]">
                        <span title={enq.message ?? ''} className="line-clamp-2">
                          {enq.message || <span className="text-[#c0b0d0] italic">No message</span>}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[enq.status]}`}>
                          {STATUS_LABELS[enq.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={enq.status}
                          disabled={updating === enq.id}
                          onChange={e => updateStatus(enq.id, e.target.value as EnquiryStatus)}
                          className="px-2 py-1.5 rounded-xl border border-[#e0d0f8] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#b48de8] disabled:opacity-50 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="enrolled">Enrolled</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#c0b0d0] mt-6">
          Abhyudaya Preschool Admin Portal · Secured by Supabase Auth
        </p>
      </div>
    </div>
  )
}

// ── Page Entry Point ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, loading } = useAdminAuth()

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #f5f0fd 0%, #e8f5f0 100%)' }}>
        <div className="bg-white rounded-3xl shadow-xl border border-[#e0d0f8] p-10 max-w-md text-center">
          <div className="text-5xl mb-4">⚙️</div>
          <h1 className="text-xl font-black text-[#5a3a8a] mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Database Not Configured
          </h1>
          <p className="text-sm text-[#6a5a7a] leading-relaxed">
            Copy <code className="bg-[#f0e8f8] px-1.5 py-0.5 rounded text-xs">.env.example</code> to{' '}
            <code className="bg-[#f0e8f8] px-1.5 py-0.5 rounded text-xs">.env.local</code> and add your real Supabase URL and anon key to enable admin features.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-3xl animate-pulse">⏳</div>
      </div>
    )
  }

  if (!user) return <AdminLogin />

  return <AdminDashboard userEmail={user.email} />
}
