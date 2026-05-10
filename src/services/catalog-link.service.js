const { Markup } = require('telegraf');

const { logger } = require('../config/logger');
const { SECTION_TEXTS } = require('../constants/section-texts');

function buildWebsiteKeyboard(url) {
  return Markup.inlineKeyboard([
    Markup.button.url('Перейти на сайт', url),
  ]);
}

async function sendCatalogLink(ctx, item) {
  if (!item.url) {
    logger.warn('Catalog link item has no url.', {
      userId: ctx.from?.id || null,
      itemId: item.id,
      title: item.title,
    });

    await ctx.reply(SECTION_TEXTS.catalogLinkUnavailable(item.title));
    return false;
  }

  await ctx.reply(
    SECTION_TEXTS.catalogLink(item.title, item.description),
    buildWebsiteKeyboard(item.url),
  );

  logger.info('Catalog external link sent.', {
    userId: ctx.from?.id || null,
    itemId: item.id,
    title: item.title,
    url: item.url,
  });

  return true;
}

module.exports = {
  sendCatalogLink,
};
