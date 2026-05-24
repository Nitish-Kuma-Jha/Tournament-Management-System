// routes/analytics.js
const express = require('express');
const router = express.Router();
const { getPlatformAnalytics, getOrganizerAnalytics, getUserAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/platform', protect, authorize('admin'), getPlatformAnalytics);
router.get('/organizer', protect, authorize('organizer'), getOrganizerAnalytics);
router.get('/user', protect, getUserAnalytics);

module.exports = router;
