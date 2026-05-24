// routes/grounds.js
const express = require('express');
const router = express.Router();
const { Ground } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const AppError = require('../utils/AppError');
const { getPaginationOptions, paginatedResponse } = require('../utils/pagination');

router.get('/', async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.city) filter['address.city'] = { $regex: req.query.city, $options: 'i' };
  if (req.query.sport) filter.sport = req.query.sport;
  const [grounds, total] = await Promise.all([
    Ground.find(filter).populate('organizer', 'name').skip(skip).limit(limit),
    Ground.countDocuments(filter),
  ]);
  res.json(paginatedResponse(grounds, total, page, limit));
});

router.get('/:id', async (req, res, next) => {
  const ground = await Ground.findById(req.params.id).populate('organizer', 'name email');
  if (!ground) return next(new AppError('Ground not found', 404));
  res.json({ success: true, data: { ground } });
});

router.post('/', protect, authorize('organizer', 'admin'), async (req, res) => {
  const ground = await Ground.create({ ...req.body, organizer: req.user._id });
  res.status(201).json({ success: true, data: { ground } });
});

router.put('/:id', protect, authorize('organizer', 'admin'), async (req, res, next) => {
  const ground = await Ground.findById(req.params.id);
  if (!ground) return next(new AppError('Ground not found', 404));
  if (ground.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized', 403));
  }
  const updated = await Ground.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: { ground: updated } });
});

router.delete('/:id', protect, authorize('organizer', 'admin'), async (req, res, next) => {
  const ground = await Ground.findById(req.params.id);
  if (!ground) return next(new AppError('Ground not found', 404));
  ground.isDeleted = true;
  await ground.save();
  res.json({ success: true, message: 'Ground deleted' });
});

module.exports = router;
