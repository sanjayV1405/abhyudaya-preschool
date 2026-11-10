const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const { connectDB, isDBConnected } = require('./config/db')
const mongoose = require('mongoose')
const enquiryRoutes = require('./routes/enquiryRoutes')
const announcementRoutes = require('./routes/announcementRoutes')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 5000

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet())

// ── CORS Configuration ────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://abhyudaya-preschool.web.app',
      'https://abhyudaya-preschool.firebaseapp.com',
    ]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true)
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes('*') ||
        process.env.NODE_ENV === 'development'
      ) {
        return callback(null, true)
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  })
)

// ── Body Parsers with sensible size limits ────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── HTTP Request Logger ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// ── Health Check Endpoint ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }
  const dbStatus = statusMap[readyState] || 'disconnected'
  res.status(200).json({
    status: 'ok',
    service: 'Abhyudaya Preschool Hybrid Backend (MERN + Supabase)',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      type: 'MongoDB Atlas',
      status: dbStatus,
      connected: isDBConnected(),
    },
    environment: process.env.NODE_ENV || 'development',
  })
})

// ── REST API Routes ───────────────────────────────────────────────────────────
app.use('/api/enquiries', enquiryRoutes)
app.use('/api/announcements', announcementRoutes)

// ── 404 & Centralized Error Handlers ──────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Server Bootstrap & Database Connection ────────────────────────────────────
async function startServer() {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`[Backend] Abhyudaya Preschool API server listening on http://localhost:${PORT}`)
    console.log(`[Backend] Health check available at: http://localhost:${PORT}/api/health`)
  })
}

// Start server if executed directly
if (require.main === module) {
  startServer()
}

module.exports = app

