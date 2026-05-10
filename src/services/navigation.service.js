const { BOT_TEXTS } = require('../constants/bot-texts');
const { getMainMenuKeyboard } = require('../keyboards/main-menu.keyboard');
const { roleSelectionKeyboard } = require('../keyboards/role-selection.keyboard');
const { getUserRole } = require('./user-role.service');

async function replyWithRoleSelection(ctx, message = BOT_TEXTS.chooseRole) {
  await ctx.reply(message, roleSelectionKeyboard);
}

async function replyWithStart(ctx, message = BOT_TEXTS.start()) {
  await replyWithRoleSelection(ctx, message);
}

async function replyWithMainMenu(ctx, message) {
  const role = getUserRole(ctx);

  if (!role) {
    await replyWithRoleSelection(ctx, message || BOT_TEXTS.roleRequired);
    return;
  }

  await ctx.reply(message || BOT_TEXTS.roleMenu(role), getMainMenuKeyboard(role));
}

async function replyWithSection(ctx, message, keyboard) {
  await ctx.reply(message, keyboard);
}

module.exports = {
  replyWithRoleSelection,
  replyWithStart,
  replyWithMainMenu,
  replyWithSection,
};
