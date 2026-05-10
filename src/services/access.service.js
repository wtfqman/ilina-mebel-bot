const { BOT_TEXTS } = require('../constants/bot-texts');
const { replyWithMainMenu, replyWithRoleSelection } = require('./navigation.service');
const { getUserRole } = require('./user-role.service');

async function ensureAllowedRole(ctx, allowedRoles = []) {
  const role = getUserRole(ctx);

  if (!role) {
    await replyWithRoleSelection(ctx, BOT_TEXTS.roleRequired);
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    await replyWithMainMenu(ctx, BOT_TEXTS.accessDenied);
    return null;
  }

  return role;
}

module.exports = {
  ensureAllowedRole,
};
