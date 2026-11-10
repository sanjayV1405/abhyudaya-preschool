const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')

// Authorized administrative email accounts matching the project's Supabase RLS and AdminPage allowlist
const DEFAULT_ADMIN_EMAILS = [
  'daycare@abhyudaya-school.com',
  'abhyudayapreschool@gmail.com',
  'jothisanjay659@gmail.com',
  'sreelakshmij67@gmail.com',
  'vkvsvishw91@gmail.com',
  'admin@abhyudayapreschool.com',
]

// Singleton Supabase client for authoritative server-side user/token verification
let supabaseAuthClient = null
function getSupabaseClient() {
  if (!supabaseAuthClient) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('[AuthMiddleware] SUPABASE_URL and SUPABASE_ANON_KEY must be set in backend/.env')
    }
    supabaseAuthClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return supabaseAuthClient
}

function getAuthorizedAdminEmails() {
  const custom = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : []
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...custom]))
}

/**
 * Express middleware to verify Supabase access JWT and enforce Admin role
 */
async function requireAdmin(req, res, next) {
  try {
    // 1. Check for optional server-to-server Admin Key (for CLI / testing / health inspection)
    const adminKey = req.headers['x-admin-key']
    if (adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY) {
      req.user = { email: 'system@admin.local', role: 'admin', auth_method: 'admin_key' }
      return next()
    }

    // 2. Extract Authorization Bearer token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header with Bearer token is required',
      })
    }

    const token = authHeader.split(' ')[1]?.trim()
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Bearer token is missing or empty',
      })
    }

    let verifiedUser = null

    // 3. Method A: Offline HMAC SHA-256 JWT signature verification (if secret is configured)
    if (process.env.SUPABASE_JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
          algorithms: ['HS256'],
        })
        verifiedUser = {
          id: decoded.sub,
          email: decoded.email,
          app_metadata: decoded.app_metadata || {},
          user_metadata: decoded.user_metadata || {},
          role: decoded.role,
        }
      } catch (jwtErr) {
        return res.status(401).json({
          success: false,
          error: `Invalid access token: ${jwtErr.message}`,
        })
      }
    } else {
      // 4. Method B: Authoritative verification against Supabase Auth API
      // Works across all signing setups (HS256, RS256, and modern asymmetric JWKS)
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data?.user) {
        return res.status(401).json({
          success: false,
          error: error ? `Supabase auth verification failed: ${error.message}` : 'Invalid or expired Supabase token',
        })
      }

      verifiedUser = data.user
    }

    // 5. Enforce Admin Authorization
    const userEmail = (verifiedUser.email || '').trim().toLowerCase()
    const isAdminRole = verifiedUser.app_metadata?.role === 'admin'
    const isAllowedEmail = getAuthorizedAdminEmails().includes(userEmail)

    if (!isAdminRole && !isAllowedEmail) {
      return res.status(403).json({
        success: false,
        error: `Access denied: Account (${userEmail || 'unknown'}) is not in the authorized administrator allowlist`,
      })
    }

    req.user = verifiedUser
    return next()
  } catch (err) {
    console.error('[AuthMiddleware] Unexpected authentication error:', err)
    return res.status(500).json({
      success: false,
      error: 'Internal authentication error',
    })
  }
}

module.exports = {
  requireAdmin,
  getAuthorizedAdminEmails,
}

