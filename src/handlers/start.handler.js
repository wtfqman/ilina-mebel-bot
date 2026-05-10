const { config } = require('../config/env');
const { logger } = require('../config/logger');
const { BOT_TEXTS } = require('../constants/bot-texts');
const { replyWithStart } = require('../services/navigation.service');
const { withErrorBoundary } = require('../utils/async-handler');

function registerStartHandler(bot) {
  bot.start(
    withErrorBoundary(async (ctx) => {
      logger.info('Received /start command.', {
        userId: ctx.from?.id,
        username: ctx.from?.username || null,
      });

      await replyWithStart(ctx, BOT_TEXTS.start(config.botName));
    }),
  );
}

module.exports = {
  registerStartHandler,
};
