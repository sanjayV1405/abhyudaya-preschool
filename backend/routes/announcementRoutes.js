const express = require('express')
const router = express.Router()
const {
  getPublicAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncementPublished,
  deleteAnnouncement,
} = require('../controllers/announcementController')
const { requireAdmin } = require('../middleware/authMiddleware')

// Public notice board feed
router.get('/', getPublicAnnouncements)

// Protected Admin announcement operations
router.get('/admin', requireAdmin, getAllAnnouncements)
router.post('/', requireAdmin, createAnnouncement)
router.put('/:id', requireAdmin, updateAnnouncement)
router.patch('/:id/publish', requireAdmin, toggleAnnouncementPublished)
router.delete('/:id', requireAdmin, deleteAnnouncement)

module.exports = router

