const express = require('express');
const router = express.Router();
const {
  createTournament, getTournaments, getTournament, updateTournament,
  deleteTournament, approveTournament, rejectTournament,
  generateBracket, getOrganizerTournaments, getTournamentStats,
} = require('../controllers/tournamentController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadBanner } = require('../config/cloudinary');

router.get('/', optionalAuth, getTournaments);
router.get('/my', protect, authorize('organizer'), getOrganizerTournaments);
router.get('/:id', optionalAuth, getTournament);
router.get('/:id/stats', protect, getTournamentStats);
router.post('/', protect, authorize('organizer', 'admin'), uploadBanner.single('banner'), createTournament);
router.put('/:id', protect, authorize('organizer', 'admin'), uploadBanner.single('banner'), updateTournament);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteTournament);
router.post('/:id/approve', protect, authorize('admin'), approveTournament);
router.post('/:id/reject', protect, authorize('admin'), rejectTournament);
router.post('/:id/generate-bracket', protect, authorize('organizer', 'admin'), generateBracket);

module.exports = router;
