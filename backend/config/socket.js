const jwt = require('jsonwebtoken');
const logger = require('./logger');

let ioInstance;

const initSocket = (io) => {
  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join personal room
    socket.join(`user:${socket.userId}`);

    // Join role room
    socket.join(`role:${socket.userRole}`);

    socket.on('join:tournament', (tournamentId) => {
      socket.join(`tournament:${tournamentId}`);
    });

    socket.on('leave:tournament', (tournamentId) => {
      socket.leave(`tournament:${tournamentId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

const emitToUser = (userId, event, data) => {
  if (ioInstance) ioInstance.to(`user:${userId}`).emit(event, data);
};

const emitToRole = (role, event, data) => {
  if (ioInstance) ioInstance.to(`role:${role}`).emit(event, data);
};

const emitToTournament = (tournamentId, event, data) => {
  if (ioInstance) ioInstance.to(`tournament:${tournamentId}`).emit(event, data);
};

const broadcastAll = (event, data) => {
  if (ioInstance) ioInstance.emit(event, data);
};

module.exports = { initSocket, getIO, emitToUser, emitToRole, emitToTournament, broadcastAll };
