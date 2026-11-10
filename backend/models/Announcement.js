const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      minlength: [2, 'Content must be at least 2 characters'],
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
    },
    published: {
      type: Boolean,
      default: true,
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

announcementSchema.index({ published: 1, createdAt: -1 })

module.exports = mongoose.model('Announcement', announcementSchema)

