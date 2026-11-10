const mongoose = require('mongoose')
const Enquiry = require('../models/Enquiry')
const { isDBConnected } = require('../config/db')

function sanitizeText(value) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/[<>]/g, '')
}

/**
 * POST /api/enquiries
 * Public endpoint to submit Parent Enquiries, Admissions, and Campus Visit requests
 */
async function createEnquiry(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database service is currently unavailable. Please call or WhatsApp us directly at +91 97887 13822.',
      })
    }

    const {
      parent_name,
      phone,
      email,
      child_name,
      child_age,
      program_id,
      message,
      enquiry_type,
      preferred_date,
      preferred_slot,
    } = req.body

    // Basic required fields check
    const cleanName = sanitizeText(parent_name)
    const cleanPhone = sanitizeText(phone)

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Parent name is required and must be at least 2 characters',
      })
    }

    if (!cleanPhone || !/^[+]?[\d\s\-().]{7,15}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid phone number (7 to 15 digits)',
      })
    }

    const payload = {
      parent_name: cleanName,
      phone: cleanPhone,
      email: email ? sanitizeText(email).toLowerCase() : undefined,
      child_name: child_name ? sanitizeText(child_name) : undefined,
      child_age: child_age ? sanitizeText(child_age) : undefined,
      program_id: program_id ? sanitizeText(program_id) : undefined,
      message: message ? sanitizeText(message).slice(0, 2000) : undefined,
      enquiry_type: enquiry_type || 'admission',
      preferred_date: preferred_date ? sanitizeText(preferred_date) : undefined,
      preferred_slot: preferred_slot ? sanitizeText(preferred_slot) : undefined,
      status: 'pending',
    }

    const newEnquiry = await Enquiry.create(payload)

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: newEnquiry,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * GET /api/enquiries
 * Protected admin endpoint to retrieve enquiries with search, filtering and pagination
 */
async function getEnquiries(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is currently unavailable',
      })
    }

    const { status, type, search } = req.query
    const query = {}

    if (status && status !== 'all') {
      query.status = status
    }

    if (type && type !== 'all') {
      query.enquiry_type = type
    }

    if (search && search.trim()) {
      const term = search.trim()
      query.$or = [
        { parent_name: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { child_name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ]
    }

    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 }).limit(500)

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * PATCH /api/enquiries/:id/status
 * Protected admin endpoint to update admission or enquiry status
 */
async function updateEnquiryStatus(req, res, next) {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is currently unavailable',
      })
    }

    const { id } = req.params
    const { status } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid enquiry ID format: "${id}"`,
      })
    }

    if (!Enquiry.ENQUIRY_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status "${status}". Allowed values: ${Enquiry.ENQUIRY_STATUSES.join(', ')}`,
      })
    }

    const updated = await Enquiry.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Enquiry with ID "${id}" was not found`,
      })
    }

    return res.status(200).json({
      success: true,
      message: `Enquiry status updated to "${status}"`,
      data: updated,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * DELETE /api/enquiries/:id
 * Protected admin endpoint to permanently remove an enquiry
 */
async function deleteEnquiry(req, res, next) {
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
        error: `Invalid enquiry ID format: "${id}"`,
      })
    }

    const deleted = await Enquiry.findByIdAndDelete(id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Enquiry with ID "${id}" was not found`,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully',
      id,
    })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
}

