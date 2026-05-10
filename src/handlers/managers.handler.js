const { logger } = require('../config/logger');
const { USER_ROLES } = require('../constants/user-roles');
const { backToMenuKeyboard } = require('../keyboards/back-to-menu.keyboard');
const { ensureAllowedRole } = require('../services/access.service');
const { replyWithSection } = require('../services/navigation.service');
const { buildManagersMessage } = require('../services/managers.service');

async function handleManagers(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.CUSTOMER]);

  if (!role) {
    return;
  }

  logger.info('Managers section opened.', { userId: ctx.from?.id });
  await replyWithSection(ctx, buildManagersMessage(), backToMenuKeyboard);
}

module.exports = {
  handleManagers,
};
