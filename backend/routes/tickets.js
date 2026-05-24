const express = require('express');
const {
  createTicket,
  getTickets,
  getTicket,
  addReply,
  updateStatus,
  assignTicket,
  reopenTicket,
  rateTicket,
  deleteTicket,
  getStats,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create ticket (all authenticated users)
router.post('/', createTicket);

// Get tickets (role-based access)
router.get('/', getTickets);

// Get ticket stats
router.get('/stats', getStats);

// Get single ticket
router.get('/:id', getTicket);

// Add reply to ticket
router.post('/:id/reply', addReply);

// Update ticket status (admin/assignee)
router.patch('/:id/status', authorize('admin', 'organizer'), updateStatus);

// Assign ticket (admin only)
router.patch('/:id/assign', authorize('admin'), assignTicket);

// Reopen ticket (requester only)
router.post('/:id/reopen', reopenTicket);

// Rate ticket (requester only)
router.post('/:id/rate', rateTicket);

// Delete ticket (role-based)
router.delete('/:id', deleteTicket);

module.exports = router;