import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// ── Environment validation ──────────────────────────────────────────────────
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const rawKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
)?.trim()

const isConfigured =
  typeof rawUrl === 'string' &&
  rawUrl.startsWith('https://') &&
  !rawUrl.includes('your-project-ref') &&
  typeof rawKey === 'string' &&
  rawKey.length > 20 &&
  !rawKey.includes('your-supabase')

// ── Client singleton ─────────────────────────────────────────────────────────
//
// When Supabase is not yet configured (no .env.local with real keys),
// we export a typed null so callers can guard with `if (!supabase)`.
// This prevents runtime crashes during local development before setup.
//
let supabase: ReturnType<typeof createClient<Database>> | null = null

if (isConfigured) {
  supabase = createClient<Database>(rawUrl!, rawKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
} else {
  console.info(
    '[Supabase] Not configured. Copy .env.example to .env.local and add your Supabase URL and Anon Key to enable database features.',
  )
}

export { supabase, isConfigured }
