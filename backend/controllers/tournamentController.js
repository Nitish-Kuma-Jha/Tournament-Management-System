const Tournament = require('../models/Tournament');
const { Registration } = require('../models/index');
const AppError = require('../utils/AppError');
const { getPaginationOptions, paginatedResponse, buildSortQuery } = require('../utils/pagination');
const { generateSingleEliminationBracket, generateRoundRobinBracket } = require('../utils/bracketGenerator');
const { createNotification } = require('../services/notificationService');
const { emitToTournament } = require('../config/socket');
const { createAuditLog } = require('../utils/auditLog');

exports.createTournament = async (req, res, next) => {
  const tournamentData = {
    ...req.body,
    organizer: req.user._id,
    status: 'pending_approval',
  };

  if (req.file) {
    tournamentData.banner = { url: req.file.path, publicId: req.file.filename };
  }

  const tournament = await Tournament.create(tournamentData);

  await createAuditLog({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'TOURNAMENT_CREATED',
    resource: 'Tournament',
    resourceId: tournament._id,
    ip: req.ip,
  });

  res.status(201).json({ success: true, message: 'Tournament created and submitted for approval', data: { tournament } });
};

exports.getTournaments = async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { search, sport, status, organizer, featured } = req.query;

  const filter = {};
  if (search) filter.$text = { $search: search };
  if (sport) filter.sport = sport;
  if (status) filter.status = status;
  if (organizer) filter.organizer = organizer;
  if (featured === 'true') filter.isFeatured = true;

  const [tournaments, total] = await Promise.all([
    Tournament.find(filter)
      .populate('organizer', 'name avatar')
      .populate('ground', 'name address.city')
      .sort(buildSortQuery(req.query.sort))
      .skip(skip)
      .limit(limit)
      .lean(),
    Tournament.countDocuments(filter),
  ]);

  res.json(paginatedResponse(tournaments, total, page, limit));
};

exports.getTournament = async (req, res, next) => {
  const tournament = await Tournament.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
  })
    .populate('organizer', 'name avatar email phone')
    .populate('ground')
    .populate('registeredTeams', 'name logo');

  if (!tournament) return next(new AppError('Tournament not found', 404));

  // Increment views
  await Tournament.findByIdAndUpdate(tournament._id, { $inc: { views: 1 } });

  res.json({ success: true, data: { tournament } });
};

exports.updateTournament = async (req, res, next) => {
  let tournament = await Tournament.findById(req.params.id);
  if (!tournament) return next(new AppError('Tournament not found', 404));

  if (req.user.role !== 'admin' && tournament.organizer.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to update this tournament', 403));
  }

  if (req.file) {
    req.body.banner = { url: req.file.path, publicId: req.file.filename };
  }

  tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  emitToTournament(req.params.id, 'tournament:updated', { tournament });

  res.json({ success: true, data: { tournament } });
};

exports.deleteTournament = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return next(new AppError('Tournament not found', 404));

  if (req.user.role !== 'admin' && tournament.organizer.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  tournament.isDeleted = true;
  tournament.deletedAt = new Date();
  tournament.status = 'cancelled';
  await tournament.save();

  res.json({ success: true, message: 'Tournament deleted successfully' });
};

exports.approveTournament = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id).populate('organizer', 'name email');
  if (!tournament) return next(new AppError('Tournament not found', 404));

  tournament.status = 'approved';
  tournament.adminReviewedBy = req.user._id;
  tournament.adminReviewedAt = new Date();
  tournament.adminNotes = req.body.notes;
  await tournament.save();

  await createNotification({
    recipient: tournament.organizer._id,
    sender: req.user._id,
    type: 'tournament_update',
    title: 'Tournament Approved!',
    message: `Your tournament "${tournament.title}" has been approved and is now live.`,
    data: { tournamentId: tournament._id },
  });

  res.json({ success: true, message: 'Tournament approved', data: { tournament } });
};

exports.rejectTournament = async (req, res, next) => {
  const { reason } = req.body;
  const tournament = await Tournament.findById(req.params.id).populate('organizer');
  if (!tournament) return next(new AppError('Tournament not found', 404));

  tournament.status = 'cancelled';
  tournament.adminNotes = reason;
  tournament.adminReviewedBy = req.user._id;
  tournament.adminReviewedAt = new Date();
  await tournament.save();

  await createNotification({
    recipient: tournament.organizer._id,
    sender: req.user._id,
    type: 'tournament_update',
    title: 'Tournament Rejected',
    message: `Your tournament "${tournament.title}" was rejected. Reason: ${reason}`,
    data: { tournamentId: tournament._id },
  });

  res.json({ success: true, message: 'Tournament rejected' });
};

exports.generateBracket = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id).populate('registeredTeams', 'name');
  if (!tournament) return next(new AppError('Tournament not found', 404));

  if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized', 403));
  }

  const approvedTeams = tournament.registeredTeams;
  if (approvedTeams.length < 2) return next(new AppError('Need at least 2 teams to generate bracket', 400));

  let bracket;
  if (tournament.format === 'round_robin') {
    bracket = generateRoundRobinBracket(approvedTeams);
  } else {
    bracket = generateSingleEliminationBracket(approvedTeams);
  }

  tournament.bracket = bracket;
  await tournament.save();

  emitToTournament(tournament._id.toString(), 'bracket:generated', { bracket });

  res.json({ success: true, message: 'Bracket generated successfully', data: { bracket } });
};

exports.getOrganizerTournaments = async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);

  const [tournaments, total] = await Promise.all([
    Tournament.find({ organizer: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('ground', 'name'),
    Tournament.countDocuments({ organizer: req.user._id }),
  ]);

  res.json(paginatedResponse(tournaments, total, page, limit));
};

exports.getTournamentStats = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return next(new AppError('Tournament not found', 404));

  const [totalRegistrations, approvedRegistrations, pendingRegistrations] = await Promise.all([
    Registration.countDocuments({ tournament: req.params.id }),
    Registration.countDocuments({ tournament: req.params.id, status: 'approved' }),
    Registration.countDocuments({ tournament: req.params.id, status: 'pending' }),
  ]);

  res.json({
    success: true,
    data: {
      totalRegistrations,
      approvedRegistrations,
      pendingRegistrations,
      spotsLeft: tournament.maxTeams - approvedRegistrations,
      fillRate: ((approvedRegistrations / tournament.maxTeams) * 100).toFixed(1),
    },
  });
};
