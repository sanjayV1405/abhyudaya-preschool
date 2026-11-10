const express = require('express')
const router = express.Router()
const {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
} = require('../controllers/enquiryController')
const { requireAdmin } = require('../middleware/authMiddleware')

// Public submission route (Parent enquiry, admission application, campus visit)
router.post('/', createEnquiry)

// Protected Admin management routes
router.get('/', requireAdmin, getEnquiries)
router.patch('/:id/status', requireAdmin, updateEnquiryStatus)
router.delete('/:id', requireAdmin, deleteEnquiry)

module.exports = router

