const mongoose = require('mongoose')

const ENQUIRY_STATUSES = ['pending', 'contacted', 'enrolled', 'closed']
const ENQUIRY_TYPES = ['admission', 'campus_visit', 'general']

const enquirySchema = new mongoose.Schema(
  {
    parent_name: {
      type: String,
      required: [true, 'Parent name is required'],
      trim: true,
      minlength: [2, 'Parent name must be at least 2 characters'],
      maxlength: [100, 'Parent name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[+]?[\d\s\-().]{7,15}$/, 'Please enter a valid phone number (7–15 digits)'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
      default: null,
    },
    child_name: {
      type: String,
      trim: true,
      maxlength: [100, 'Child name cannot exceed 100 characters'],
      default: null,
    },
    child_age: {
      type: String,
      trim: true,
      maxlength: [100, 'Child age/program description cannot exceed 100 characters'],
      default: null,
    },
    program_id: {
      type: String,
      trim: true,
      default: null,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: null,
    },
    enquiry_type: {
      type: String,
      enum: {
        values: ENQUIRY_TYPES,
        message: '{VALUE} is not a valid enquiry type',
      },
      default: 'admission',
    },
    preferred_date: {
      type: String,
      trim: true,
      default: null,
    },
    preferred_slot: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ENQUIRY_STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString()
        ret.created_at = ret.createdAt ? ret.createdAt.toISOString() : new Date().toISOString()
        delete ret.__v
        return ret
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString()
        ret.created_at = ret.createdAt ? ret.createdAt.toISOString() : new Date().toISOString()
        delete ret.__v
        return ret
      },
    },
  }
)

// Index for performant querying in admin dashboard
enquirySchema.index({ status: 1, createdAt: -1 })
enquirySchema.index({ enquiry_type: 1, createdAt: -1 })

module.exports = mongoose.model('Enquiry', enquirySchema)
module.exports.ENQUIRY_STATUSES = ENQUIRY_STATUSES
module.exports.ENQUIRY_TYPES = ENQUIRY_TYPES

