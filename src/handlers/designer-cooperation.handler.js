const { logger } = require('../config/logger');
const { DESIGNER_ACTION_BUTTONS } = require('../constants/buttons');
const { SECTION_TEXTS } = require('../constants/section-texts');
const { createSectionActionsKeyboard } = require('../keyboards/section-actions.keyboard');
const { SCENE_IDS } = require('../constants/scenes');
const { USER_ROLES } = require('../constants/user-roles');
const { ensureAllowedRole } = require('../services/access.service');
const { replyWithSection } = require('../services/navigation.service');

async function handleDesignerCooperation(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.DESIGNER]);

  if (!role) {
    return;
  }

  logger.info('Designer cooperation section opened.', { userId: ctx.from?.id });
  await replyWithSection(
    ctx,
    SECTION_TEXTS.cooperationIntro,
    createSectionActionsKeyboard([DESIGNER_ACTION_BUTTONS.START_COOPERATION_FORM]),
  );
}

async function handleDesignerProfileForm(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.DESIGNER]);

  if (!role) {
    return;
  }

  logger.info('Designer profile form opened.', { userId: ctx.from?.id });
  await ctx.scene.enter(SCENE_IDS.DESIGNER_PROFILE);
}

module.exports = {
  handleDesignerCooperation,
  handleDesignerProfileForm,
};
