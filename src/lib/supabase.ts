import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// ── Environment validation ──────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined

const isConfigured =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-ref') &&
  typeof supabaseKey === 'string' &&
  supabaseKey.length > 20 &&
  !supabaseKey.includes('your-supabase')

// ── Client singleton ─────────────────────────────────────────────────────────
//
// When Supabase is not yet configured (no .env.local with real keys),
// we export a typed null so callers can guard with `if (!supabase)`.
// This prevents runtime crashes during local development before setup.
//
let supabase: ReturnType<typeof createClient<Database>> | null = null

if (isConfigured) {
  supabase = createClient<Database>(supabaseUrl!, supabaseKey!, {
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
