// routes/registrations.js
const express = require('express');
const router = express.Router();
const {
  registerTeam, approveRegistration, rejectRegistration,
  getTournamentRegistrations, getUserRegistrations, withdrawRegistration,
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, getUserRegistrations);
router.get('/tournament/:tournamentId', protect, getTournamentRegistrations);
router.post('/', protect, registerTeam);
router.put('/:id/approve', protect, authorize('organizer', 'admin'), approveRegistration);
router.put('/:id/reject', protect, authorize('organizer', 'admin'), rejectRegistration);
router.put('/:id/withdraw', protect, withdrawRegistration);

module.exports = router;
