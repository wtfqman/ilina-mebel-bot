const { logger } = require('../config/logger');
const { BOT_TEXTS } = require('../constants/bot-texts');
const { clearConsultationForm } = require('../services/consultation-form.service');
const { clearDesignerForm } = require('../services/designer-form.service');
const { clearDesignerProjectForm } = require('../services/designer-project-form.service');
const { clearRequestForm } = require('../services/request-form.service');
const { replyWithMainMenu } = require('../services/navigation.service');

async function resetSceneState(ctx) {
  clearRequestForm(ctx);
  clearConsultationForm(ctx);
  clearDesignerForm(ctx);
  clearDesignerProjectForm(ctx);

  if (ctx?.scene?.current) {
    try {
      await ctx.scene.leave();
    } catch (leaveError) {
      logger.error('Failed to leave active scene after error.', leaveError);
    }
  }
}

async function handleBotError(error, ctx) {
  logger.error('Bot error.', {
    message: error.message,
    stack: error.stack,
    updateId: ctx?.update?.update_id || null,
    userId: ctx?.from?.id || null,
  });

  if (!ctx) {
    return;
  }

  await resetSceneState(ctx);

  try {
    await replyWithMainMenu(ctx, BOT_TEXTS.genericError);
  } catch (replyError) {
    logger.error('Failed to send error message to user.', replyError);
  }
}

module.exports = {
  handleBotError,
};
