const express = require('express');
const router = express.Router();
const { Payment } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const { getPaginationOptions, paginatedResponse } = require('../utils/pagination');

router.get('/my', protect, async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const [payments, total] = await Promise.all([
    Payment.find({ user: req.user._id })
      .populate('tournament', 'title sport')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments({ user: req.user._id }),
  ]);
  res.json(paginatedResponse(payments, total, page, limit));
});

router.post('/', protect, async (req, res) => {
  const payment = await Payment.create({
    ...req.body,
    user: req.user._id,
    status: 'completed', // Simulated - integrate real gateway in production
    transactionId: 'TXN_' + Date.now(),
  });
  res.status(201).json({ success: true, data: { payment } });
});

router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const [payments, total] = await Promise.all([
    Payment.find()
      .populate('user', 'name email')
      .populate('tournament', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(),
  ]);
  res.json(paginatedResponse(payments, total, page, limit));
});

module.exports = router;
