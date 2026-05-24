const mongoose = require('mongoose');

// Ground Model
const groundSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sport: { type: String, required: true },
  address: {
    street: String,
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  capacity: { type: Number, default: 0 },
  facilities: [String],
  images: [{ url: String, publicId: String }],
  contactPhone: String,
  contactEmail: String,
  isAvailable: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

groundSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.find({ isDeleted: { $ne: true } });
  next();
});

// Registration Model
const registrationSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waitlisted', 'withdrawn'],
    default: 'pending',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'waived'],
    default: 'pending',
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  documents: [{
    name: String,
    url: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  notes: String,
  adminNotes: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

registrationSchema.index({ tournament: 1, team: 1 }, { unique: true });

// Payment Model
const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  transactionId: { type: String, index: true },
  paymentMethod: { type: String, enum: ['online', 'offline', 'waived'], default: 'online' },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  refundedAt: Date,
  refundReason: String,
}, { timestamps: true });

// Notification Model
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: [
      'registration_approved', 'registration_rejected', 'tournament_update',
      'match_scheduled', 'match_result', 'payment_received', 'account_verified',
      'account_suspended', 'system_announcement', 'new_message', 'team_invite',
    ],
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false, index: true },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// AuditLog Model
const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  actorRole: { type: String },
  action: { type: String, required: true, index: true },
  resource: { type: String, index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  changes: { type: mongoose.Schema.Types.Mixed },
  ip: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1, action: 1 });

// Event Model
const eventSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
  title: { type: String, required: true },
  round: { type: Number, required: true },
  matchNumber: { type: Number, required: true },
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  ground: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground' },
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
    index: true,
  },
  result: {
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    scoreA: { type: String, default: '' },
    scoreB: { type: String, default: '' },
    notes: String,
  },
  bracketPosition: String,
}, { timestamps: true });

// Ticket Model
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

module.exports = {
  Ground: mongoose.model('Ground', groundSchema),
  Registration: mongoose.model('Registration', registrationSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  Event: mongoose.model('Event', eventSchema),
  Ticket: mongoose.model('Ticket', ticketSchema),
};
