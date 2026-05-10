const { logger } = require('../config/logger');
const { PRICE_PDF_FILE, PRICE_TELEGRAM_FILE_ID } = require('../config/price');
const { USER_ROLES } = require('../constants/user-roles');
const { backToMenuKeyboard } = require('../keyboards/back-to-menu.keyboard');
const { ensureAllowedRole } = require('../services/access.service');
const {
  resolveAssetPath,
  sendDocumentByTelegramFileId,
  sendDocumentIfExists,
} = require('../services/file.service');
const { replyWithSection } = require('../services/navigation.service');
const { buildPriceMessage } = require('../services/price.service');

async function sendPricePdf(ctx, options) {
  if (PRICE_TELEGRAM_FILE_ID) {
    try {
      const isSentByFileId = await sendDocumentByTelegramFileId(ctx, PRICE_TELEGRAM_FILE_ID, options);

      if (isSentByFileId) {
        logger.info('Price PDF sent by telegramFileId.', { userId: ctx.from?.id });
        return true;
      }
    } catch (error) {
      logger.error('Failed to send price PDF by telegramFileId.', {
        userId: ctx.from?.id,
        message: error.message,
      });
    }
  }

  const isSentByLocalFile = await sendDocumentIfExists(ctx, resolveAssetPath('pdf', PRICE_PDF_FILE), options);

  if (isSentByLocalFile) {
    logger.info('Price PDF sent by local file.', { userId: ctx.from?.id });
  }

  return isSentByLocalFile;
}

async function handlePrice(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.CUSTOMER]);

  if (!role) {
    return;
  }

  logger.info('Price section opened.', { userId: ctx.from?.id });
  await replyWithSection(ctx, buildPriceMessage(), backToMenuKeyboard);

  const isSent = await sendPricePdf(ctx, {
    caption: 'Подробный прайс в PDF.',
  });

  if (!isSent) {
    await replyWithSection(
      ctx,
      'PDF-версия прайса пока готовится. Текстовая версия выше уже доступна.',
      backToMenuKeyboard,
    );
  }
}

module.exports = {
  handlePrice,
};
