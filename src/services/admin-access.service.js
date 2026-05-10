const { config } = require('../config/env');

function normalizeUserId(userId) {
  if (typeof userId === 'undefined' || userId === null) {
    return '';
  }

  return String(userId);
}

function isAdminUser(userId) {
  const normalizedUserId = normalizeUserId(userId);

  return Boolean(normalizedUserId && config.adminIds.includes(normalizedUserId));
}

module.exports = {
  isAdminUser,
};
