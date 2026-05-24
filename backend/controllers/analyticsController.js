const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { Registration, Payment } = require('../models/index');
const Team = require('../models/Team');

exports.getPlatformAnalytics = async (req, res) => {
  const { period = '30' } = req.query;
  const days = parseInt(period);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    userGrowth,
    tournamentGrowth,
    registrationStats,
    sportDistribution,
    statusDistribution,
  ] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Tournament.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Registration.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Tournament.aggregate([
      { $group: { _id: '$sport', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Tournament.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      userGrowth,
      tournamentGrowth,
      registrationStats,
      sportDistribution,
      statusDistribution,
    },
  });
};

exports.getOrganizerAnalytics = async (req, res) => {
  const organizerId = req.user._id;
  const { period = '30' } = req.query;
  const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

  const tournaments = await Tournament.find({ organizer: organizerId }).select('_id title');
  const tournamentIds = tournaments.map(t => t._id);

  const [
    registrationTrend,
    statusBreakdown,
    sportBreakdown,
  ] = await Promise.all([
    Registration.aggregate([
      { $match: { tournament: { $in: tournamentIds }, createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Registration.aggregate([
      { $match: { tournament: { $in: tournamentIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Tournament.aggregate([
      { $match: { organizer: organizerId } },
      { $group: { _id: '$sport', count: { $sum: 1 } } },
    ]),
  ]);

  const totalTournaments = await Tournament.countDocuments({ organizer: organizerId });
  const totalRegistrations = await Registration.countDocuments({ tournament: { $in: tournamentIds } });

  res.json({
    success: true,
    data: {
      summary: { totalTournaments, totalRegistrations },
      registrationTrend,
      statusBreakdown,
      sportBreakdown,
    },
  });
};

exports.getUserAnalytics = async (req, res) => {
  const userId = req.user._id;

  const registrations = await Registration.find({ registeredBy: userId })
    .populate('tournament', 'title sport status');

  const teamIds = (await Team.find({ captain: userId })).map(t => t._id);
  const teams = await Team.find({ captain: userId }).select('stats name sport');

  const statusBreakdown = registrations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const sportBreakdown = registrations.reduce((acc, r) => {
    if (r.tournament) {
      acc[r.tournament.sport] = (acc[r.tournament.sport] || 0) + 1;
    }
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      summary: {
        totalRegistrations: registrations.length,
        totalTeams: teams.length,
      },
      statusBreakdown,
      sportBreakdown,
      teamStats: teams.map(t => ({ name: t.name, sport: t.sport, ...t.stats })),
    },
  });
};
