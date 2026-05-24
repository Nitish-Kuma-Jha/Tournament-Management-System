// routes/events.js
const express = require('express');
const router = express.Router();
const { Event } = require('../models/index');
const Tournament = require('../models/Tournament');
const { protect, authorize } = require('../middleware/auth');
const AppError = require('../utils/AppError');
const { emitToTournament } = require('../config/socket');

router.get('/tournament/:tournamentId', async (req, res, next) => {
  const events = await Event.find({ tournament: req.params.tournamentId })
    .populate('teamA', 'name logo')
    .populate('teamB', 'name logo')
    .populate('ground', 'name address')
    .sort({ round: 1, matchNumber: 1 });
  res.json({ success: true, data: { events } });
});

router.post('/', protect, authorize('organizer', 'admin'), async (req, res) => {
  const event = await Event.create(req.body);
  emitToTournament(req.body.tournament, 'event:created', { event });
  res.status(201).json({ success: true, data: { event } });
});

router.put('/:id', protect, authorize('organizer', 'admin'), async (req, res, next) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!event) return next(new AppError('Event not found', 404));
  emitToTournament(event.tournament.toString(), 'event:updated', { event });
  res.json({ success: true, data: { event } });
});

router.put('/:id/result', protect, authorize('organizer', 'admin'), async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) return next(new AppError('Event not found', 404));
  event.result = req.body.result;
  event.status = 'completed';
  event.endedAt = new Date();
  await event.save();
  emitToTournament(event.tournament.toString(), 'match:result', { event });
  res.json({ success: true, data: { event } });
});

module.exports = router;
