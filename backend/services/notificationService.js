const { Notification } = require('../models/index');
const { emitToUser } = require('../config/socket');
const logger = require('../config/logger');

exports.createNotification = async ({ recipient, sender, type, title, message, data }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      data,
    });

    // Real-time notification via Socket.io
    emitToUser(recipient.toString(), 'notification:new', {
      _id: notification._id,
      type,
      title,
      message,
      data,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    logger.error(`Notification creation failed: ${error.message}`);
  }
};

exports.createBulkNotifications = async (notifications) => {
  try {
    const created = await Notification.insertMany(notifications);
    created.forEach(n => {
      emitToUser(n.recipient.toString(), 'notification:new', {
        _id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
      });
    });
    return created;
  } catch (error) {
    logger.error(`Bulk notification creation failed: ${error.message}`);
  }
};

exports.markAllRead = async (userId) => {
  return Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

exports.getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};
