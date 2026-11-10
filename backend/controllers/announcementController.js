const mongoose = require('mongoose')
const Announcement = require('../models/Announcement')
const { isDBConnected } = require('../config/db')

function sanitizeText(value) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/[<>]/g, '')
}

/**
 * GET /api/announcements
 * Public endpoint: returns published announcements for website visitors (hero banner & notice board)
 */
async function getPublicAnnouncements(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database is temporarily unavailable',
        data: [],
      })
    }

    const announcements = await Announcement.find({ published: true }).sort({ createdAt: -1 }).limit(50)

    return res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * GET /api/announcements/admin
 * Protected admin endpoint: returns all announcements (both published and drafts)
 */
async function getAllAnnouncements(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is currently unavailable',
        data: [],
      })
    }

    const announcements = await Announcement.find().sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * POST /api/announcements
 * Protected admin endpoint: create a new school announcement
 */
async function createAnnouncement(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is currently unavailable',
      })
    }

    const { title, content, published } = req.body

    const cleanTitle = sanitizeText(title)
    const cleanContent = sanitizeText(content)

    if (!cleanTitle || cleanTitle.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Announcement title is required (at least 2 characters)',
      })
    }

    if (!cleanContent || cleanContent.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Announcement content is required (at least 2 characters)',
      })
    }

    const newAnnouncement = await Announcement.create({
      title: cleanTitle,
      content: cleanContent,
      published: typeof published === 'boolean' ? published : true,
    })

    return res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: newAnnouncement,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * PUT /api/announcements/:id
 * Protected admin endpoint: update an existing announcement
 */
async function updateAnnouncement(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is currently unavailable',
      })
    }

    const { id } = req.params
    const { title, content, published } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid announcement ID format: "${id}"`,
      })
    }

    const updatePayload = {}
    if (typeof title === 'string') updatePayload.title = sanitizeText(title)
    if (typeof content === 'string') updatePayload.content = sanitizeText(content)
    if (typeof published === 'boolean') updatePayload.published = published

    const updated = await Announcement.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    })

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Announcement with ID "${id}" was not found`,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: updated,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * PATCH /api/announcements/:id/publish
 * Protected admin endpoint: toggle published / draft state
 */
async function toggleAnnouncementPublished(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is currently unavailable',
      })
    }

    const { id } = req.params
    const { published } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid announcement ID format: "${id}"`,
      })
    }

    const announcement = await Announcement.findById(id)
    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: `Announcement with ID "${id}" was not found`,
      })
    }

    // Toggle or set explicit boolean
    announcement.published = typeof published === 'boolean' ? published : !announcement.published
    await announcement.save()

    return res.status(200).json({
      success: true,
      message: `Announcement "${announcement.title}" is now ${announcement.published ? 'published' : 'draft'}`,
      data: announcement,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * DELETE /api/announcements/:id
 * Protected admin endpoint: delete an announcement
 */
async function deleteAnnouncement(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is currently unavailable',
      })
    }

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid announcement ID format: "${id}"`,
      })
    }

    const deleted = await Announcement.findByIdAndDelete(id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Announcement with ID "${id}" was not found`,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
      id,
    })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  getPublicAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncementPublished,
  deleteAnnouncement,
}

