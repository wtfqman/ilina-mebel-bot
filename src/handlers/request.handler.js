const { logger } = require('../config/logger');
const { SCENE_IDS } = require('../constants/scenes');
const { USER_ROLES } = require('../constants/user-roles');
const { ensureAllowedRole } = require('../services/access.service');

async function handleRequest(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.CUSTOMER]);

  if (!role) {
    return;
  }

  logger.info('Customer request form opened.', { userId: ctx.from?.id });
  await ctx.scene.enter(SCENE_IDS.CUSTOMER_REQUEST);
}

module.exports = {
  handleRequest,
};
