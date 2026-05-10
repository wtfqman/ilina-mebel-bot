const { logger } = require('../config/logger');
const { replyWithMainMenu } = require('../services/navigation.service');

async function handleBackToMenu(ctx) {
  logger.info('Returned to main menu.', { userId: ctx.from?.id });
  await replyWithMainMenu(ctx);
}

module.exports = {
  handleBackToMenu,
};
