const { config, normalizeTelegramUserId } = require('../config/env');
const { logger } = require('../config/logger');

function checkAdminAccess(userId) {
  const normalizedUserId = normalizeTelegramUserId(userId);
  const hasAccess = normalizedUserId !== null && config.adminIds.includes(normalizedUserId);

  logger.info('Admin access check.', {
    userId: normalizedUserId,
    adminIds: config.adminIds,
    hasAccess,
  });

  return {
    userId: normalizedUserId,
    adminIds: config.adminIds,
    hasAccess,
  };
}

function isAdminUser(userId) {
  const { hasAccess } = checkAdminAccess(userId);

  return hasAccess;
}

module.exports = {
  checkAdminAccess,
  isAdminUser,
};
