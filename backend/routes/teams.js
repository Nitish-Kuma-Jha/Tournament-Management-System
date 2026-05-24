// routes/teams.js
const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const AppError = require('../utils/AppError');
const { protect } = require('../middleware/auth');
const { getPaginationOptions, paginatedResponse } = require('../utils/pagination');

router.get('/', async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.sport) filter.sport = req.query.sport;
  if (req.query.search) filter.$text = { $search: req.query.search };
  const [teams, total] = await Promise.all([
    Team.find(filter).populate('captain', 'name avatar').skip(skip).limit(limit),
    Team.countDocuments(filter),
  ]);
  res.json(paginatedResponse(teams, total, page, limit));
});

router.get('/:id', async (req, res, next) => {
  const team = await Team.findById(req.params.id)
    .populate('captain', 'name avatar email')
    .populate('members.user', 'name avatar');
  if (!team) return next(new AppError('Team not found', 404));
  res.json({ success: true, data: { team } });
});

router.post('/', protect, async (req, res) => {
  const team = await Team.create({
    ...req.body,
    captain: req.user._id,
    members: [{ user: req.user._id, role: 'captain' }],
  });
  res.status(201).json({ success: true, data: { team } });
});

router.put('/:id', protect, async (req, res, next) => {
  const team = await Team.findById(req.params.id);
  if (!team) return next(new AppError('Team not found', 404));
  if (team.captain.toString() !== req.user._id.toString()) return next(new AppError('Not authorized', 403));
  const updated = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: { team: updated } });
});

router.post('/:id/members', protect, async (req, res, next) => {
  const team = await Team.findById(req.params.id);
  if (!team) return next(new AppError('Team not found', 404));
  if (team.captain.toString() !== req.user._id.toString()) return next(new AppError('Not authorized', 403));
  const existing = team.members.find(m => m.user.toString() === req.body.userId);
  if (existing) return next(new AppError('User already in team', 400));
  team.members.push({ user: req.body.userId, role: req.body.role || 'player' });
  await team.save();
  res.json({ success: true, data: { team } });
});

router.delete('/:id/members/:userId', protect, async (req, res, next) => {
  const team = await Team.findById(req.params.id);
  if (!team) return next(new AppError('Team not found', 404));
  if (team.captain.toString() !== req.user._id.toString()) return next(new AppError('Not authorized', 403));
  team.members = team.members.filter(m => m.user.toString() !== req.params.userId);
  await team.save();
  res.json({ success: true, data: { team } });
});

module.exports = router;
