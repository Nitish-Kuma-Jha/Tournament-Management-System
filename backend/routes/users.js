// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Team = require('../models/Team');
const AppError = require('../utils/AppError');
const { protect } = require('../middleware/auth');
const { uploadAvatar, uploadDocument } = require('../config/cloudinary');
const { getPaginationOptions, paginatedResponse } = require('../utils/pagination');

router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { user } });
});

router.put('/profile', protect, async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'dateOfBirth', 'preferences'];
  const updates = {};
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: { user } });
});

router.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload an image', 400));
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: { url: req.file.path, publicId: req.file.filename } },
    { new: true }
  );
  res.json({ success: true, data: { user } });
});

router.post('/upload-document', protect, uploadDocument.single('document'), async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a document', 400));
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { govIdDocument: { url: req.file.path, publicId: req.file.filename } },
    { new: true }
  );
  res.json({ success: true, message: 'Document uploaded successfully', data: { user } });
});

router.get('/teams', protect, async (req, res) => {
  const teams = await Team.find({ 'members.user': req.user._id })
    .populate('members.user', 'name avatar');
  res.json({ success: true, data: { teams } });
});

module.exports = router;
