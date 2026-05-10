const { logger } = require('../config/logger');
const { USER_ROLES } = require('../constants/user-roles');
const { backToMenuKeyboard } = require('../keyboards/back-to-menu.keyboard');
const { ensureAllowedRole } = require('../services/access.service');
const { buildFaqMessage } = require('../services/faq.service');
const { replyWithSection } = require('../services/navigation.service');

async function handleFaq(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.CUSTOMER]);

  if (!role) {
    return;
  }

  logger.info('FAQ section opened.', { userId: ctx.from?.id });
  await replyWithSection(ctx, buildFaqMessage(), backToMenuKeyboard);
}

module.exports = {
  handleFaq,
};
