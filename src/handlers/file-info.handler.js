const { logger } = require('../config/logger');
const {
  extractTelegramFileMetadata,
  formatTelegramFileMetadata,
} = require('../services/file-metadata.service');

async function handleFileInfo(ctx, metadata) {
  await ctx.reply(formatTelegramFileMetadata(metadata));

  logger.info('User uploaded file and bot returned file_id.', {
    userId: ctx.from?.id || null,
    username: ctx.from?.username || null,
    messageId: ctx.message?.message_id || null,
    type: metadata.type,
    fileName: metadata.name,
    fileUniqueId: metadata.fileUniqueId,
  });
}

function registerFileInfoHandler(bot) {
  bot.use(async (ctx, next) => {
    const metadata = extractTelegramFileMetadata(ctx.message);

    if (!metadata) {
      return next();
    }

    await handleFileInfo(ctx, metadata);
    return undefined;
  });
}

module.exports = {
  registerFileInfoHandler,
};
