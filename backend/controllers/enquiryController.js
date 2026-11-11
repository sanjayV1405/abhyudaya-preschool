const mongoose = require('mongoose')
const Enquiry = require('../models/Enquiry')
const { isDBConnected } = require('../config/db')
const { sendMail } = require('../config/mailer')

// All addresses that should receive enquiry notification emails
const NOTIFICATION_EMAILS = [
  process.env.NOTIFY_EMAIL || 'daycare@abhyudaya-school.com',
  'jothisanjay659@gmail.com',
]

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

    // ── Email Notification ────────────────────────────────────────────────────
    const enquiryTypeLabel =
      payload.enquiry_type === 'campus_visit' ? 'Campus Visit' : 'Admission Enquiry'

    const emailHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
  <div style="background:#2d7a3a;padding:20px;text-align:center;">
    <h2 style="color:#fff;margin:0;">📋 New ${enquiryTypeLabel}</h2>
    <p style="color:#c8f5cf;margin:4px 0 0;">Abhyudaya Preschool — Admissions Portal</p>
  </div>
  <div style="padding:24px;background:#fff;">
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:8px;color:#555;width:40%;"><strong>Parent Name</strong></td><td style="padding:8px;">${payload.parent_name}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;"><strong>Phone / WhatsApp</strong></td><td style="padding:8px;">${payload.phone}</td></tr>
      ${payload.email ? `<tr><td style="padding:8px;color:#555;"><strong>Email</strong></td><td style="padding:8px;">${payload.email}</td></tr>` : ''}
      ${payload.child_name ? `<tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;"><strong>Child Name</strong></td><td style="padding:8px;">${payload.child_name}</td></tr>` : ''}
      ${payload.child_age ? `<tr><td style="padding:8px;color:#555;"><strong>Child Age</strong></td><td style="padding:8px;">${payload.child_age}</td></tr>` : ''}
      ${payload.program_id ? `<tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;"><strong>Program</strong></td><td style="padding:8px;">${payload.program_id}</td></tr>` : ''}
      ${payload.preferred_date ? `<tr><td style="padding:8px;color:#555;"><strong>Preferred Date</strong></td><td style="padding:8px;">${payload.preferred_date}</td></tr>` : ''}
      ${payload.preferred_slot ? `<tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;"><strong>Preferred Slot</strong></td><td style="padding:8px;">${payload.preferred_slot}</td></tr>` : ''}
      ${payload.message ? `<tr><td style="padding:8px;color:#555;"><strong>Message</strong></td><td style="padding:8px;">${payload.message}</td></tr>` : ''}
    </table>
    <div style="margin-top:20px;padding:12px;background:#f0f8f0;border-left:4px solid #2d7a3a;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#555;">Submitted at: <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</strong></p>
      <p style="margin:4px 0 0;font-size:13px;color:#555;">Record ID: <code>${newEnquiry._id}</code></p>
    </div>
  </div>
  <div style="background:#f4f4f4;padding:12px;text-align:center;font-size:12px;color:#999;">
    Abhyudaya Preschool &amp; Daycare · Coimbatore · <a href="https://abhyudaya-preschool.web.app" style="color:#2d7a3a;">abhyudaya-preschool.web.app</a>
  </div>
</div>`

    const emailText =
      `New ${enquiryTypeLabel} — Abhyudaya Preschool\n\n` +
      `Parent: ${payload.parent_name}\n` +
      `Phone: ${payload.phone}\n` +
      (payload.email ? `Email: ${payload.email}\n` : '') +
      (payload.child_name ? `Child: ${payload.child_name}\n` : '') +
      (payload.child_age ? `Age: ${payload.child_age}\n` : '') +
      (payload.program_id ? `Program: ${payload.program_id}\n` : '') +
      (payload.preferred_date ? `Preferred Date: ${payload.preferred_date}\n` : '') +
      (payload.preferred_slot ? `Preferred Slot: ${payload.preferred_slot}\n` : '') +
      (payload.message ? `Message: ${payload.message}\n` : '') +
      `\nRecord ID: ${newEnquiry._id}`

    // Fire-and-forget — do not await so the API response is instant
    sendMail({
      to: NOTIFICATION_EMAILS,
      subject: `📋 New ${enquiryTypeLabel} from ${payload.parent_name}`,
      html: emailHtml,
      text: emailText,
    })
    // ─────────────────────────────────────────────────────────────────────────

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

