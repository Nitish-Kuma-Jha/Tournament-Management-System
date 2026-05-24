const express = require('express');
const router = express.Router();
const { Notification } = require('../models/index');
const { protect } = require('../middleware/auth');
const { markAllRead, getUnreadCount } = require('../services/notificationService');
const { getPaginationOptions, paginatedResponse } = require('../utils/pagination');

router.get('/', protect, async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const filter = { recipient: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  res.json(paginatedResponse(notifications, total, page, limit));
});

router.get('/unread-count', protect, async (req, res) => {
  const count = await getUnreadCount(req.user._id);
  res.json({ success: true, data: { count } });
});

router.put('/:id/read', protect, async (req, res, next) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!n) return next(require('../utils/AppError').default('Not found', 404));
  res.json({ success: true, data: { notification: n } });
});

router.put('/mark-all-read', protect, async (req, res) => {
  await markAllRead(req.user._id);
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = router;
