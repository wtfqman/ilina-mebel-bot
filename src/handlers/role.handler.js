const { logger } = require('../config/logger');
const { BOT_TEXTS } = require('../constants/bot-texts');
const { COMMON_BUTTONS, ROLE_BUTTONS } = require('../constants/buttons');
const { USER_ROLES } = require('../constants/user-roles');
const { replyWithMainMenu, replyWithRoleSelection } = require('../services/navigation.service');
const { clearUserRole, setUserRole } = require('../services/user-role.service');
const { withErrorBoundary } = require('../utils/async-handler');

async function handleRoleSelection(ctx, role) {
  setUserRole(ctx, role);
  logger.info('User role selected.', {
    userId: ctx.from?.id,
    role,
  });
  await replyWithMainMenu(ctx, BOT_TEXTS.roleSelected(role));
}

async function handleChangeRole(ctx) {
  clearUserRole(ctx);
  logger.info('User role cleared.', {
    userId: ctx.from?.id,
  });
  await replyWithRoleSelection(ctx, BOT_TEXTS.roleChanged);
}

function registerRoleHandlers(bot) {
  bot.hears(
    ROLE_BUTTONS.CUSTOMER,
    withErrorBoundary(async (ctx) => {
      await handleRoleSelection(ctx, USER_ROLES.CUSTOMER);
    }),
  );

  bot.hears(
    ROLE_BUTTONS.DESIGNER,
    withErrorBoundary(async (ctx) => {
      await handleRoleSelection(ctx, USER_ROLES.DESIGNER);
    }),
  );

  bot.hears(COMMON_BUTTONS.CHANGE_ROLE, withErrorBoundary(handleChangeRole));
}

module.exports = {
  registerRoleHandlers,
};
