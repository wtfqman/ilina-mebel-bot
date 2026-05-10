const { logger } = require('../config/logger');
const { USER_ROLES } = require('../constants/user-roles');
const { backToMenuKeyboard } = require('../keyboards/back-to-menu.keyboard');
const { ensureAllowedRole } = require('../services/access.service');
const { buildLocationMessage } = require('../services/location.service');
const { replyWithSection } = require('../services/navigation.service');

async function handleLocation(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.CUSTOMER, USER_ROLES.DESIGNER]);

  if (!role) {
    return;
  }

  logger.info('Location section opened.', { userId: ctx.from?.id, role });
  await replyWithSection(ctx, buildLocationMessage(), backToMenuKeyboard);
}

module.exports = {
  handleLocation,
};
