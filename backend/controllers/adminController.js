const User = require('../models/User');
const Tournament = require('../models/Tournament');
const { Registration, Payment, AuditLog, Notification } = require('../models/index');
const AppError = require('../utils/AppError');
const { getPaginationOptions, paginatedResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');

exports.getDashboardStats = async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    totalOrganizers,
    totalTournaments,
    pendingTournaments,
    activeTournaments,
    totalRegistrations,
    pendingRegistrations,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', status: 'active' }),
    User.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'organizer', status: 'active' }),
    Tournament.countDocuments(),
    Tournament.countDocuments({ status: 'pending_approval' }),
    Tournament.countDocuments({ status: { $in: ['registration_open', 'ongoing'] } }),
    Registration.countDocuments(),
    Registration.countDocuments({ status: 'pending' }),
  ]);

  // User growth last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Tournament by sport
  const tournamentsBySport = await Tournament.aggregate([
    { $group: { _id: '$sport', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, active: activeUsers, pending: pendingUsers },
      organizers: { total: totalOrganizers },
      tournaments: { total: totalTournaments, pending: pendingTournaments, active: activeTournaments },
      registrations: { total: totalRegistrations, pending: pendingRegistrations },
      charts: { userGrowth, tournamentsBySport },
    },
  });
};

exports.getAllUsers = async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { role, status, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json(paginatedResponse(users, total, page, limit));
};

exports.updateUserStatus = async (req, res, next) => {
  const { status, reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  const prevStatus = user.status;
  user.status = status;
  await user.save();

  await createNotification({
    recipient: user._id,
    sender: req.user._id,
    type: status === 'active' ? 'account_verified' : 'account_suspended',
    title: status === 'active' ? 'Account Activated!' : 'Account Suspended',
    message: status === 'active'
      ? 'Your account has been activated. Welcome!'
      : `Your account has been suspended. Reason: ${reason || 'Policy violation'}`,
  });

  res.json({ success: true, message: `User status updated to ${status}`, data: { user } });
};

exports.verifyUserDocument = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  user.govIdDocument.verified = true;
  user.status = 'active';
  await user.save();

  await createNotification({
    recipient: user._id,
    type: 'account_verified',
    title: 'Document Verified!',
    message: 'Your government ID has been verified. Your account is now fully active.',
  });

  res.json({ success: true, message: 'Document verified and account activated' });
};

exports.getPendingApprovals = async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);

  const [pendingUsers, pendingTournaments, pendingRegistrations] = await Promise.all([
    User.find({ status: 'pending' }).sort({ createdAt: -1 }).skip(skip).limit(limit / 3 | 0),
    Tournament.find({ status: 'pending_approval' }).populate('organizer', 'name email').sort({ createdAt: -1 }).limit(limit / 3 | 0),
    Registration.find({ status: 'pending' })
      .populate('tournament', 'title')
      .populate('team', 'name')
      .populate('registeredBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit / 3 | 0),
  ]);

  res.json({
    success: true,
    data: { pendingUsers, pendingTournaments, pendingRegistrations },
  });
};

exports.getAuditLogs = async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { action, actor, from, to } = req.query;

  const filter = {};
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (actor) filter.actor = actor;
  if (from || to) filter.createdAt = {};
  if (from) filter.createdAt.$gte = new Date(from);
  if (to) filter.createdAt.$lte = new Date(to);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  res.json(paginatedResponse(logs, total, page, limit));
};

exports.sendAnnouncement = async (req, res) => {
  const { title, message, roles = ['user', 'organizer'] } = req.body;

  const users = await User.find({ role: { $in: roles }, status: 'active' }).select('_id');

  const notifications = users.map(u => ({
    recipient: u._id,
    sender: req.user._id,
    type: 'system_announcement',
    title,
    message,
    data: { fromAdmin: true },
  }));

  const { createBulkNotifications } = require('../services/notificationService');
  await createBulkNotifications(notifications);

  res.json({ success: true, message: `Announcement sent to ${users.length} users` });
};
