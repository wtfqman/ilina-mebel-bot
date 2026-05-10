const { logger } = require('../config/logger');
const { SECTION_TEXTS } = require('../constants/section-texts');
const { resolveAssetPath, sendDocumentIfExists } = require('./file.service');

function buildPdfCaption(item) {
  return SECTION_TEXTS.catalogPdf(item.title);
}

function buildLogMeta(ctx, item, extra = {}) {
  return {
    userId: ctx.from?.id || null,
    itemId: item.id,
    title: item.title,
    telegramFileId: item.telegramFileId || '',
    pdfPath: item.pdfPath || '',
    ...extra,
  };
}

async function sendByTelegramFileId(ctx, item, options) {
  if (!item.telegramFileId) {
    return false;
  }

  try {
    await ctx.replyWithDocument(item.telegramFileId, options);
    logger.info('Catalog PDF sent by telegramFileId.', buildLogMeta(ctx, item));
    return true;
  } catch (error) {
    logger.error('Failed to send catalog PDF by telegramFileId.', buildLogMeta(ctx, item, {
      message: error.message,
    }));
    return false;
  }
}

async function sendByPdfPath(ctx, item, options) {
  if (!item.pdfPath) {
    return false;
  }

  const absolutePath = resolveAssetPath('catalogs', item.pdfPath);

  try {
    const isSent = await sendDocumentIfExists(ctx, absolutePath, options);

    if (!isSent) {
      logger.warn('Catalog PDF local file was not found.', buildLogMeta(ctx, item, {
        absolutePath,
      }));
      return false;
    }

    logger.info('Catalog PDF sent by local pdfPath.', buildLogMeta(ctx, item, {
      absolutePath,
    }));
    return true;
  } catch (error) {
    logger.error('Failed to send catalog PDF by local pdfPath.', buildLogMeta(ctx, item, {
      absolutePath,
      message: error.message,
    }));
    return false;
  }
}

async function sendCatalogPdf(ctx, item) {
  const options = {
    caption: buildPdfCaption(item),
  };

  if (!item.telegramFileId && !item.pdfPath) {
    logger.warn('Catalog PDF item has neither telegramFileId nor pdfPath.', buildLogMeta(ctx, item));
    return {
      isSent: false,
      source: null,
    };
  }

  if (item.telegramFileId && await sendByTelegramFileId(ctx, item, options)) {
    return {
      isSent: true,
      source: 'telegramFileId',
    };
  }

  if (item.telegramFileId && item.pdfPath) {
    logger.warn('Trying catalog PDF fallback through pdfPath.', buildLogMeta(ctx, item));
  }

  if (await sendByPdfPath(ctx, item, options)) {
    return {
      isSent: true,
      source: 'pdfPath',
    };
  }

  return {
    isSent: false,
    source: null,
  };
}

module.exports = {
  sendCatalogPdf,
};
