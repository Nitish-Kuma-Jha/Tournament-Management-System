const { Ticket, AuditLog } = require('../models/index');
const { createNotification } = require('../services/notificationService');
const { emitToUser, emitToRole } = require('../config/socket');
const AppError = require('../utils/AppError');
const { getPaginationOptions, paginatedResponse } = require('../utils/pagination');

// Create a new support ticket
exports.createTicket = async (req, res, next) => {
  try {
    const { title, description, category, priority = 'medium', attachments } = req.body;
    const requester = req.user.id;

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority,
      requester,
      attachments: attachments || [],
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        source: 'web',
      },
    });

    // Create audit log
    await AuditLog.create({
      actor: requester,
      actorRole: req.user.role,
      action: 'create',
      resource: 'ticket',
      resourceId: ticket._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Notify admins about new ticket
    await createNotification({
      recipient: null, // Will be sent to all admins
      sender: requester,
      type: 'new_message',
      title: 'New Support Ticket',
      message: `New ${category} ticket: ${title}`,
      data: { ticketId: ticket._id },
    });

    // Emit to admin role
    emitToRole('admin', 'ticket:new', {
      ticketId: ticket._id,
      title,
      category,
      priority,
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// Get all tickets (with role-based filtering)
exports.getTickets = async (req, res, next) => {
  try {
    const {
      status,
      category,
      priority,
      assignedTo,
      requester,
      search,
      sort,
    } = req.query;

    const { page, limit, skip } = getPaginationOptions(req.query);
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = { isDeleted: false };

    // Role-based filtering
    if (userRole === 'user') {
      query.requester = userId;
    } else if (userRole === 'organizer') {
      query.requester = userId;
    } else if (userRole === 'admin') {
      if (assignedTo) query.assignedTo = assignedTo;
      if (requester) query.requester = requester;
    }

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Text search support
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort(sort ? { [sort.split(':')[0]]: sort.split(':')[1] === 'asc' ? 1 : -1 } : { lastActivity: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('requester', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('replies.author', 'name email avatar role');

    return res.json(paginatedResponse(tickets, total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Get single ticket
exports.getTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await Ticket.findById(id)
      .populate('requester', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('replies.author', 'name email avatar role');

    if (!ticket || ticket.isDeleted) {
      return next(new AppError('Ticket not found', 404));
    }

    // Check permissions
    if (userRole === 'user' && ticket.requester._id.toString() !== userId) {
      return next(new AppError('Access denied', 403));
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// Add reply to ticket
exports.addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, isInternal = false, attachments } = req.body;
    const author = req.user.id;
    const userRole = req.user.role;

    const ticket = await Ticket.findById(id);
    if (!ticket || ticket.isDeleted) {
      return next(new AppError('Ticket not found', 404));
    }

    // Check permissions
    if (userRole === 'user' && ticket.requester.toString() !== author) {
      return next(new AppError('Access denied', 403));
    }

    // Add reply
    ticket.replies.push({
      author,
      message,
      isInternal,
      attachments: attachments || [],
    });

    // Update status if user replied
    if (userRole === 'user' && ticket.status === 'waiting_for_user') {
      ticket.status = 'open';
    }

    await ticket.save();

    // Create audit log
    await AuditLog.create({
      actor: author,
      actorRole: userRole,
      action: 'reply',
      resource: 'ticket',
      resourceId: ticket._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Notify the other party
    const recipientId = userRole === 'user' ? ticket.assignedTo : ticket.requester;
    if (recipientId) {
      await createNotification({
        recipient: recipientId,
        sender: author,
        type: 'new_message',
        title: `New reply on ticket: ${ticket.title}`,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        data: { ticketId: ticket._id },
      });

      emitToUser(recipientId.toString(), 'ticket:reply', {
        ticketId: ticket._id,
        author: { name: req.user.name, role: userRole },
        message: message.substring(0, 100),
      });
    }

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: ticket.replies[ticket.replies.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

// Update ticket status (admin/assigned user)
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await Ticket.findById(id);
    if (!ticket || ticket.isDeleted) {
      return next(new AppError('Ticket not found', 404));
    }

    // Check permissions
    if (userRole !== 'admin' && ticket.assignedTo?.toString() !== userId) {
      return next(new AppError('Access denied', 403));
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    if (resolution) ticket.resolution = resolution;

    await ticket.save();

    // Create audit log
    await AuditLog.create({
      actor: userId,
      actorRole: userRole,
      action: 'update_status',
      resource: 'ticket',
      resourceId: ticket._id,
      changes: { oldStatus, newStatus: status },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Notify requester
    await createNotification({
      recipient: ticket.requester,
      sender: userId,
      type: 'system_announcement',
      title: `Ticket status updated: ${ticket.title}`,
      message: `Your ticket status has been changed to ${status}`,
      data: { ticketId: ticket._id },
    });

    emitToUser(ticket.requester.toString(), 'ticket:status_update', {
      ticketId: ticket._id,
      status,
      title: ticket.title,
    });

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// Assign ticket to user (admin only)
exports.assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const userId = req.user.id;

    const ticket = await Ticket.findById(id);
    if (!ticket || ticket.isDeleted) {
      return next(new AppError('Ticket not found', 404));
    }

    const oldAssigned = ticket.assignedTo;
    ticket.assignedTo = assignedTo;
    ticket.status = 'in_progress';

    await ticket.save();

    // Create audit log
    await AuditLog.create({
      actor: userId,
      actorRole: 'admin',
      action: 'assign',
      resource: 'ticket',
      resourceId: ticket._id,
      changes: { oldAssigned, newAssigned: assignedTo },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Notify assigned user
    if (assignedTo) {
      await createNotification({
        recipient: assignedTo,
        sender: userId,
        type: 'system_announcement',
        title: 'Ticket assigned to you',
        message: `You have been assigned ticket: ${ticket.title}`,
        data: { ticketId: ticket._id },
      });

      emitToUser(assignedTo, 'ticket:assigned', {
        ticketId: ticket._id,
        title: ticket.title,
      });
    }

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// Reopen ticket
exports.reopenTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await Ticket.findById(id);
    if (!ticket || ticket.isDeleted) {
      return next(new AppError('Ticket not found', 404));
    }

    // Only requester can reopen
    if (ticket.requester.toString() !== userId) {
      return next(new AppError('Access denied', 403));
    }

    // Can only reopen resolved or closed tickets
    if (!['resolved', 'closed'].includes(ticket.status)) {
      return next(new AppError('Ticket cannot be reopened', 400));
    }

    ticket.status = 'reopened';
    ticket.replies.push({
      author: userId,
      message: `Ticket reopened. Reason: ${reason || 'No reason provided'}`,
    });

    await ticket.save();

    // Create audit log
    await AuditLog.create({
      actor: userId,
      actorRole: userRole,
      action: 'reopen',
      resource: 'ticket',
      resourceId: ticket._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Notify admins
    emitToRole('admin', 'ticket:reopened', {
      ticketId: ticket._id,
      title: ticket.title,
    });

    res.json({
      success: true,
      message: 'Ticket reopened successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// Rate ticket (requester only)
exports.rateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;
    const userId = req.user.id;

    const ticket = await Ticket.findById(id);
    if (!ticket || ticket.isDeleted) {
      return next(new AppError('Ticket not found', 404));
    }

    // Only requester can rate
    if (ticket.requester.toString() !== userId) {
      return next(new AppError('Access denied', 403));
    }

    // Can only rate resolved tickets
    if (ticket.status !== 'resolved') {
      return next(new AppError('Can only rate resolved tickets', 400));
    }

    ticket.rating = {
      score,
      comment,
      ratedAt: new Date(),
    };

    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket rated successfully',
      data: ticket.rating,
    });
  } catch (error) {
    next(error);
  }
};

// Delete ticket (soft delete)
exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await Ticket.findById(id);
    if (!ticket || ticket.isDeleted) {
      return next(new AppError('Ticket not found', 404));
    }

    // Check permissions
    if (userRole === 'user' && ticket.requester.toString() !== userId) {
      return next(new AppError('Access denied', 403));
    }

    ticket.isDeleted = true;
    ticket.deletedAt = new Date();
    await ticket.save();

    // Create audit log
    await AuditLog.create({
      actor: userId,
      actorRole: userRole,
      action: 'delete',
      resource: 'ticket',
      resourceId: ticket._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get ticket statistics
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let matchQuery = { isDeleted: false };

    if (userRole === 'user') {
      matchQuery.requester = userId;
    }

    const stats = await Ticket.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          avgResponseTime: { $avg: '$responseTime' },
          avgRating: { $avg: '$rating.score' },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      avgResponseTime: 0,
      avgRating: 0,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};