const path = require('path')
// Ensure backend/.env is loaded even if db.js is required independently
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })
require('dotenv').config()
const mongoose = require('mongoose')

/**
 * Mask MongoDB URI to safely display in logs without leaking credentials
 */
function maskMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '<unset>'
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
}

/**
 * Normalize MongoDB URI by encoding special characters (like '@') in the password
 * to prevent RFC 3986 parsing errors (e.g. "querySrv ENOTFOUND _mongodb._tcp.<password>")
 */
function normalizeMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') return rawUri
  const trimmed = rawUri.trim()
  const match = trimmed.match(/^(mongodb(?:\+srv)?:\/\/)(.*)@([^/@]+)(.*)$/)
  if (!match) return trimmed
  const [, protocol, userInfo, host, rest] = match
  const colonIndex = userInfo.indexOf(':')
  if (colonIndex === -1) return trimmed
  const username = userInfo.slice(0, colonIndex)
  let password = userInfo.slice(colonIndex + 1)
  // If password contains raw '@' and is not already encoded as '%40'
  if (password.includes('@') && !password.includes('%40')) {
    password = password.replace(/@/g, '%40')
  }
  return `${protocol}${username}:${password}@${host}${rest}`
}

/**
 * Connect to MongoDB Atlas
 */
async function connectDB() {
  const rawUri = process.env.MONGODB_URI

  if (!rawUri || !rawUri.trim()) {
    console.warn('[MongoDB] MONGODB_URI is not defined in backend/.env. Database operations will be disabled.')
    return false
  }

  const uri = normalizeMongoUri(rawUri)
  const masked = maskMongoUri(uri)

  console.log(`[MongoDB] Initializing connection to: ${masked}`)

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== 'production',
    })

    console.log(`[MongoDB] Connected successfully to Atlas cluster: ${conn.connection.host} (DB: ${conn.connection.name})`)
    return true
  } catch (error) {
    console.error(`[MongoDB] Connection error:`, error.message)
    if (error.message.includes('whitelist') || error.message.includes('Could not connect to any servers')) {
      console.warn('[MongoDB Atlas Hint] Check IP Whitelist in MongoDB Atlas -> Network Access. Your current IP address must be allowed (e.g., 0.0.0.0/0 for development access).')
    }
    return false
  }
}

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Connection state: CONNECTED')
})

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection state: DISCONNECTED')
})

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Connection state: RECONNECTED')
})

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Runtime error:', err.message)
})

function isDBConnected() {
  return mongoose.connection.readyState === 1
}

module.exports = {
  connectDB,
  isDBConnected,
  maskMongoUri,
  normalizeMongoUri,
}
