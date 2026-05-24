const { AuditLog } = require('../models/index');
const logger = require('../config/logger');

exports.createAuditLog = async ({
  actor,
  actorRole,
  action,
  resource,
  resourceId,
  changes,
  ip,
  userAgent,
  status = 'success',
  metadata,
}) => {
  try {
    await AuditLog.create({
      actor,
      actorRole,
      action,
      resource,
      resourceId,
      changes,
      ip,
      userAgent,
      status,
      metadata,
    });
  } catch (error) {
    logger.error(`Audit log creation failed: ${error.message}`);
  }
};

exports.auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode < 400 && req.user) {
        exports.createAuditLog({
          actor: req.user._id,
          actorRole: req.user.role,
          action,
          resource,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }
      return originalSend(data);
    };
    next();
  };
};
