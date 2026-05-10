const { logger } = require('../config/logger');
const { SCENE_IDS } = require('../constants/scenes');
const { USER_ROLES } = require('../constants/user-roles');
const { ensureAllowedRole } = require('../services/access.service');

async function handleConsultation(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.CUSTOMER, USER_ROLES.DESIGNER]);

  if (!role) {
    return;
  }

  logger.info('Consultation form opened.', { userId: ctx.from?.id, role });
  await ctx.scene.enter(SCENE_IDS.CONSULTATION);
}

module.exports = {
  handleConsultation,
};
