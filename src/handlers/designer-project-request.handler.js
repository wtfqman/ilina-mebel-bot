const { logger } = require('../config/logger');
const { SCENE_IDS } = require('../constants/scenes');
const { USER_ROLES } = require('../constants/user-roles');
const { ensureAllowedRole } = require('../services/access.service');

async function handleDesignerProjectRequest(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.DESIGNER]);

  if (!role) {
    return;
  }

  logger.info('Designer project request form opened.', { userId: ctx.from?.id });
  await ctx.scene.enter(SCENE_IDS.DESIGNER_PROJECT_REQUEST);
}

module.exports = {
  handleDesignerProjectRequest,
};
