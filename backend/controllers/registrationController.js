const { Registration, Payment } = require('../models/index');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const AppError = require('../utils/AppError');
const { getPaginationOptions, paginatedResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');
const { sendRegistrationApprovedEmail } = require('../utils/email');

exports.registerTeam = async (req, res, next) => {
  const { tournamentId, teamId } = req.body;

  const [tournament, team] = await Promise.all([
    Tournament.findById(tournamentId),
    Team.findById(teamId),
  ]);

  if (!tournament) return next(new AppError('Tournament not found', 404));
  if (!team) return next(new AppError('Team not found', 404));
  if (team.captain.toString() !== req.user._id.toString()) {
    return next(new AppError('Only team captain can register', 403));
  }
  if (!['registration_open', 'approved'].includes(tournament.status)) {
    return next(new AppError('Tournament is not accepting registrations', 400));
  }
  if (tournament.registeredTeams.length >= tournament.maxTeams) {
    return next(new AppError('Tournament is full', 400));
  }
  if (new Date() > tournament.registrationDeadline) {
    return next(new AppError('Registration deadline has passed', 400));
  }

  const existing = await Registration.findOne({ tournament: tournamentId, team: teamId });
  if (existing) return next(new AppError('Team already registered for this tournament', 409));

  const registration = await Registration.create({
    tournament: tournamentId,
    team: teamId,
    registeredBy: req.user._id,
    status: 'pending',
    paymentStatus: tournament.entryFee > 0 ? 'pending' : 'waived',
  });

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Awaiting approval.',
    data: { registration },
  });
};

exports.approveRegistration = async (req, res, next) => {
  const registration = await Registration.findById(req.params.id)
    .populate('tournament', 'title organizer')
    .populate('team', 'name')
    .populate('registeredBy', 'name email');

  if (!registration) return next(new AppError('Registration not found', 404));

  if (req.user.role === 'organizer' && registration.tournament.organizer.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  registration.status = 'approved';
  registration.reviewedBy = req.user._id;
  registration.reviewedAt = new Date();
  registration.adminNotes = req.body.notes;
  await registration.save();

  // Add team to tournament
  await Tournament.findByIdAndUpdate(registration.tournament._id, {
    $addToSet: { registeredTeams: registration.team._id },
  });

  await createNotification({
    recipient: registration.registeredBy._id,
    sender: req.user._id,
    type: 'registration_approved',
    title: 'Registration Approved!',
    message: `Your team "${registration.team.name}" has been approved for "${registration.tournament.title}".`,
    data: { registrationId: registration._id, tournamentId: registration.tournament._id },
  });

  try {
    await sendRegistrationApprovedEmail(registration.registeredBy, registration.tournament.title);
  } catch (_) {}

  res.json({ success: true, message: 'Registration approved', data: { registration } });
};

exports.rejectRegistration = async (req, res, next) => {
  const { reason } = req.body;
  const registration = await Registration.findById(req.params.id)
    .populate('tournament', 'title organizer')
    .populate('team', 'name')
    .populate('registeredBy', 'name email');

  if (!registration) return next(new AppError('Registration not found', 404));

  if (req.user.role === 'organizer' && registration.tournament.organizer.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  registration.status = 'rejected';
  registration.adminNotes = reason;
  registration.reviewedBy = req.user._id;
  registration.reviewedAt = new Date();
  await registration.save();

  await createNotification({
    recipient: registration.registeredBy._id,
    type: 'registration_rejected',
    title: 'Registration Rejected',
    message: `Your registration for "${registration.tournament.title}" was rejected. Reason: ${reason}`,
  });

  res.json({ success: true, message: 'Registration rejected' });
};

exports.getTournamentRegistrations = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.tournamentId);
  if (!tournament) return next(new AppError('Tournament not found', 404));

  if (req.user.role === 'organizer' && tournament.organizer.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  const { page, limit, skip } = getPaginationOptions(req.query);
  const filter = { tournament: req.params.tournamentId };
  if (req.query.status) filter.status = req.query.status;

  const [registrations, total] = await Promise.all([
    Registration.find(filter)
      .populate('team', 'name logo sport')
      .populate('registeredBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Registration.countDocuments(filter),
  ]);

  res.json(paginatedResponse(registrations, total, page, limit));
};

exports.getUserRegistrations = async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);

  const [registrations, total] = await Promise.all([
    Registration.find({ registeredBy: req.user._id })
      .populate('tournament', 'title sport status startDate banner')
      .populate('team', 'name logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Registration.countDocuments({ registeredBy: req.user._id }),
  ]);

  res.json(paginatedResponse(registrations, total, page, limit));
};

exports.withdrawRegistration = async (req, res, next) => {
  const registration = await Registration.findById(req.params.id);
  if (!registration) return next(new AppError('Registration not found', 404));

  if (registration.registeredBy.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  if (['approved'].includes(registration.status)) {
    return next(new AppError('Cannot withdraw an approved registration. Contact organizer.', 400));
  }

  registration.status = 'withdrawn';
  await registration.save();

  res.json({ success: true, message: 'Registration withdrawn' });
};
