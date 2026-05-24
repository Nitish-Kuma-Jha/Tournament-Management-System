require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const { Ground } = require('../models/index');

const seedData = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB for seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Tournament.deleteMany({}),
    Team.deleteMany({}),
    Ground.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Create Admin
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@tournamentsystem.com',
    password: 'Admin@123456',
    role: 'admin',
    status: 'active',
    emailVerified: true,
  });
  console.log('Admin created:', admin.email);

  // Create Organizers
  const organizers = await User.create([
    {
      name: 'Cricket Association',
      email: 'cricket@organizer.com',
      password: 'Organizer@123',
      role: 'organizer',
      status: 'active',
      emailVerified: true,
    },
    {
      name: 'Football Club Manager',
      email: 'football@organizer.com',
      password: 'Organizer@123',
      role: 'organizer',
      status: 'active',
      emailVerified: true,
    },
  ]);
  console.log('Organizers created');

  // Create Users
  const users = await User.create([
    { name: 'Rahul Sharma', email: 'rahul@user.com', password: 'User@12345', role: 'user', status: 'active', emailVerified: true },
    { name: 'Priya Patel', email: 'priya@user.com', password: 'User@12345', role: 'user', status: 'active', emailVerified: true },
    { name: 'Amit Singh', email: 'amit@user.com', password: 'User@12345', role: 'user', status: 'active', emailVerified: true },
    { name: 'Neha Gupta', email: 'neha@user.com', password: 'User@12345', role: 'user', status: 'active', emailVerified: true },
  ]);
  console.log('Users created');

  // Create Grounds
  const grounds = await Ground.create([
    {
      name: 'DY Patil Stadium',
      organizer: organizers[0]._id,
      sport: 'cricket',
      address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      capacity: 55000,
      facilities: ['Floodlights', 'Parking', 'Cafeteria', 'Locker Rooms'],
    },
    {
      name: 'Jawaharlal Nehru Stadium',
      organizer: organizers[1]._id,
      sport: 'football',
      address: { city: 'New Delhi', state: 'Delhi', country: 'India' },
      capacity: 75000,
      facilities: ['Floodlights', 'VIP Box', 'Medical Room'],
    },
  ]);
  console.log('Grounds created');

  // Create Teams
  const teams = await Team.create([
    {
      name: 'Mumbai Warriors',
      captain: users[0]._id,
      sport: 'cricket',
      members: [
        { user: users[0]._id, role: 'captain' },
        { user: users[1]._id, role: 'player' },
      ],
      stats: { tournamentsPlayed: 5, wins: 3, losses: 2 },
    },
    {
      name: 'Delhi Titans',
      captain: users[2]._id,
      sport: 'cricket',
      members: [
        { user: users[2]._id, role: 'captain' },
        { user: users[3]._id, role: 'player' },
      ],
      stats: { tournamentsPlayed: 4, wins: 2, losses: 2 },
    },
    {
      name: 'Royal Strikers',
      captain: users[1]._id,
      sport: 'football',
      members: [{ user: users[1]._id, role: 'captain' }],
      stats: { tournamentsPlayed: 3, wins: 2, losses: 1 },
    },
  ]);
  console.log('Teams created');

  // Create Tournaments
  const now = new Date();
  await Tournament.create([
    {
      title: 'Premier Cricket Championship 2025',
      description: 'The biggest cricket tournament of the year. Top teams compete for ultimate glory.',
      sport: 'cricket',
      format: 'single_elimination',
      organizer: organizers[0]._id,
      ground: grounds[0]._id,
      status: 'registration_open',
      registrationDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      startDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      maxTeams: 16,
      entryFee: 5000,
      prizeMoney: { first: 100000, second: 50000, third: 25000 },
      isFeatured: true,
      registeredTeams: [teams[0]._id, teams[1]._id],
    },
    {
      title: 'City Football League Season 3',
      description: 'Annual city football league. 5-a-side format. Open to all amateur teams.',
      sport: 'football',
      format: 'round_robin',
      organizer: organizers[1]._id,
      ground: grounds[1]._id,
      status: 'approved',
      registrationDeadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      startDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
      maxTeams: 8,
      entryFee: 2000,
      prizeMoney: { first: 30000, second: 15000 },
      isFeatured: true,
    },
    {
      title: 'Inter-College Badminton Championship',
      description: 'Annual inter-college badminton tournament. Singles and doubles events.',
      sport: 'badminton',
      format: 'single_elimination',
      organizer: organizers[0]._id,
      status: 'pending_approval',
      registrationDeadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      startDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      maxTeams: 32,
      entryFee: 500,
    },
  ]);
  console.log('Tournaments created');

  console.log('\n✅ Seed data created successfully!\n');
  console.log('Login credentials:');
  console.log('Admin:     admin@tournamentsystem.com / Admin@123456');
  console.log('Organizer: cricket@organizer.com / Organizer@123');
  console.log('User:      rahul@user.com / User@12345');

  process.exit(0);
};

seedData().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
