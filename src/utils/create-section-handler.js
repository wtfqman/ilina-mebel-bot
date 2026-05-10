const { logger } = require('../config/logger');
const { replyWithSection } = require('../services/navigation.service');

function createSectionHandler({ logMessage, text, keyboard }) {
  return async (ctx) => {
    logger.info(logMessage, { userId: ctx.from?.id });
    await replyWithSection(ctx, text, keyboard);
  };
}

module.exports = {
  createSectionHandler,
};
