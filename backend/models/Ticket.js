const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Ticket title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Ticket description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: true,
    enum: [
      'registration_issue',
      'payment_issue',
      'tournament_query',
      'account_issue',
      'technical_bug',
      'refund_request',
      'organizer_support',
      'general_inquiry',
      'complaint',
      'feature_request'
    ],
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed', 'reopened'],
    default: 'open',
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters'],
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
    attachments: [{
      filename: String,
      url: String,
      publicId: String,
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  attachments: [{
    filename: String,
    url: String,
    publicId: String,
  }],
  tags: [String],
  resolution: {
    type: String,
    maxlength: [500, 'Resolution cannot exceed 500 characters'],
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: [200, 'Rating comment cannot exceed 200 characters'],
    },
    ratedAt: Date,
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web',
    },
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  lastActivity: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
ticketSchema.index({ requester: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ title: 'text', description: 'text' });

// Virtual for response time
ticketSchema.virtual('responseTime').get(function() {
  if (this.replies.length > 0) {
    const firstReply = this.replies[0];
    return firstReply.createdAt - this.createdAt;
  }
  return null;
});

// Virtual for total replies
ticketSchema.virtual('totalReplies').get(function() {
  return this.replies.length;
});

// Pre-save middleware
ticketSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);