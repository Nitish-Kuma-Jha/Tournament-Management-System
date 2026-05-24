const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tournament title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    index: 'text',
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  sport: {
    type: String,
    required: [true, 'Sport type is required'],
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'kabaddi', 'chess', 'esports', 'other'],
    index: true,
  },
  format: {
    type: String,
    enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'league'],
    required: true,
    default: 'single_elimination',
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  ground: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ground',
  },
  banner: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'],
    default: 'draft',
    index: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  maxTeams: {
    type: Number,
    required: true,
    min: [2, 'Minimum 2 teams required'],
    max: [128, 'Maximum 128 teams allowed'],
  },
  minTeams: {
    type: Number,
    default: 2,
  },
  teamSize: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 11 },
  },
  entryFee: {
    type: Number,
    default: 0,
    min: [0, 'Entry fee cannot be negative'],
  },
  prizeMoney: {
    first: { type: Number, default: 0 },
    second: { type: Number, default: 0 },
    third: { type: Number, default: 0 },
  },
  rules: [String],
  categories: [{
    name: String,
    ageMin: Number,
    ageMax: Number,
    gender: { type: String, enum: ['male', 'female', 'mixed', 'open'] },
  }],
  registeredTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  }],
  bracket: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  tags: [{ type: String, lowercase: true }],
  views: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false, index: true },
  adminNotes: String,
  adminReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminReviewedAt: Date,
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
tournamentSchema.index({ title: 'text', description: 'text', tags: 'text' });
tournamentSchema.index({ sport: 1, status: 1, startDate: 1 });
tournamentSchema.index({ organizer: 1, status: 1 });
tournamentSchema.index({ startDate: 1, endDate: 1 });

// Virtuals
tournamentSchema.virtual('registeredCount').get(function () {
  return this.registeredTeams ? this.registeredTeams.length : 0;
});

tournamentSchema.virtual('spotsLeft').get(function () {
  return this.maxTeams - (this.registeredTeams ? this.registeredTeams.length : 0);
});

tournamentSchema.virtual('isFull').get(function () {
  return this.registeredTeams && this.registeredTeams.length >= this.maxTeams;
});

tournamentSchema.virtual('daysUntilStart').get(function () {
  return Math.ceil((this.startDate - new Date()) / (1000 * 60 * 60 * 24));
});

// Auto-generate slug
tournamentSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  next();
});

// Soft delete filter
tournamentSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Tournament', tournamentSchema);
