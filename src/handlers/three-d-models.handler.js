const { logger } = require('../config/logger');
const { USER_ROLES } = require('../constants/user-roles');
const { SECTION_TEXTS } = require('../constants/section-texts');
const { ensureAllowedRole } = require('../services/access.service');
const { replyWithSection } = require('../services/navigation.service');
const {
  getDesignerModelById,
  getDesignerModelsKeyboard,
  sendDesignerModelAsset,
} = require('../services/designer-models.service');

async function handleThreeDModels(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.DESIGNER]);

  if (!role) {
    return;
  }

  logger.info('3D models section opened.', { userId: ctx.from?.id });
  await replyWithSection(ctx, SECTION_TEXTS.designerModelsIntro, getDesignerModelsKeyboard());
}

function createDesignerModelItemHandler(itemId) {
  return async (ctx) => {
    const role = await ensureAllowedRole(ctx, [USER_ROLES.DESIGNER]);

    if (!role) {
      return;
    }

    const item = getDesignerModelById(itemId);

    if (!item) {
      logger.warn('3D model item not found.', { itemId, userId: ctx.from?.id });
      await handleThreeDModels(ctx);
      return;
    }

    logger.info('3D model item opened.', {
      userId: ctx.from?.id,
      itemId: item.id,
    });

    const response = await sendDesignerModelAsset(ctx, item);
    await replyWithSection(ctx, response.text, response.keyboard);
  };
}

module.exports = {
  handleThreeDModels,
  createDesignerModelItemHandler,
};
