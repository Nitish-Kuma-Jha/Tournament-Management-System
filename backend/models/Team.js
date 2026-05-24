const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [50, 'Team name cannot exceed 50 characters'],
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['captain', 'player', 'substitute'], default: 'player' },
    jerseyNumber: Number,
    joinedAt: { type: Date, default: Date.now },
  }],
  logo: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  sport: {
    type: String,
    required: true,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'kabaddi', 'chess', 'esports', 'other'],
  },
  description: { type: String, maxlength: 500 },
  city: String,
  country: String,
  stats: {
    tournamentsPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
  },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

teamSchema.index({ captain: 1 });
teamSchema.index({ sport: 1 });
teamSchema.index({ name: 'text' });

teamSchema.virtual('winRate').get(function () {
  if (this.stats.tournamentsPlayed === 0) return 0;
  return ((this.stats.wins / this.stats.tournamentsPlayed) * 100).toFixed(1);
});

teamSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);
