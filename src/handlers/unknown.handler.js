const { BOT_TEXTS } = require('../constants/bot-texts');
const { replyWithMainMenu, replyWithRoleSelection } = require('../services/navigation.service');
const { getUserRole } = require('../services/user-role.service');
const { withErrorBoundary } = require('../utils/async-handler');

function registerUnknownHandler(bot) {
  bot.on(
    'message',
    withErrorBoundary(async (ctx) => {
      if (getUserRole(ctx)) {
        await replyWithMainMenu(ctx, BOT_TEXTS.unknownWithRole);
        return;
      }

      await replyWithRoleSelection(ctx, BOT_TEXTS.unknownWithoutRole);
    }),
  );
}

module.exports = {
  registerUnknownHandler,
};
