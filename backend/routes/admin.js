// routes/admin.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, updateUserStatus, verifyUserDocument,
  getPendingApprovals, getAuditLogs, sendAnnouncement,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/verify-document', verifyUserDocument);
router.get('/pending-approvals', getPendingApprovals);
router.get('/audit-logs', getAuditLogs);
router.post('/announcements', sendAnnouncement);

module.exports = router;
