const { logger } = require('../config/logger');
const { USER_ROLES } = require('../constants/user-roles');
const { replyWithSection } = require('../services/navigation.service');
const { ensureAllowedRole } = require('../services/access.service');
const { sendCatalogLink } = require('../services/catalog-link.service');
const { getUserRole } = require('../services/user-role.service');
const {
  buildCatalogSubmenuResponse,
  clearCatalogBackTarget,
  getCatalogCurrentParentId,
  getCatalogIntroMessage,
  getCatalogItemById,
  getCatalogItemByTitle,
  getCatalogListKeyboard,
  getCatalogRequestSceneId,
  getRememberedCatalogBackTarget,
  isCatalogItemAllowedForRole,
  sendCatalogPdfAsset,
  setCatalogCurrentParent,
} = require('../services/catalog.service');

async function handleCatalog(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.CUSTOMER, USER_ROLES.DESIGNER]);

  if (!role) {
    return;
  }

  clearCatalogBackTarget(ctx);
  setCatalogCurrentParent(ctx);
  logger.info('Catalog section opened.', { userId: ctx.from?.id, role });
  await replyWithSection(ctx, getCatalogIntroMessage(role), await getCatalogListKeyboard(role));
}

async function handleCatalogBack(ctx) {
  const role = await ensureAllowedRole(ctx, [USER_ROLES.CUSTOMER, USER_ROLES.DESIGNER]);

  if (!role) {
    return;
  }

  const backTarget = await getRememberedCatalogBackTarget(ctx);

  if (!backTarget || !isCatalogItemAllowedForRole(backTarget, role)) {
    await handleCatalog(ctx);
    return;
  }

  logger.info('Returned to previous catalog level.', {
    userId: ctx.from?.id,
    role,
    itemId: backTarget.id,
  });

  setCatalogCurrentParent(ctx, backTarget.id);
  const response = buildCatalogSubmenuResponse(backTarget, role);
  await replyWithSection(ctx, response.text, response.keyboard);
}

async function handleCatalogRequestItem(ctx, item, role) {
  logger.info('Catalog request form opened from catalog item.', {
    userId: ctx.from?.id,
    role,
    itemId: item.id,
  });

  await ctx.scene.enter(getCatalogRequestSceneId(item, role));
}

async function handleCatalogItem(ctx, item, role) {
  if (!isCatalogItemAllowedForRole(item, role)) {
    await handleCatalog(ctx);
    return;
  }

  logger.info('Catalog item opened.', {
    userId: ctx.from?.id,
    role,
    itemId: item.id,
    type: item.type,
  });

  if (item.type === 'submenu') {
    setCatalogCurrentParent(ctx, item.id);
    const response = buildCatalogSubmenuResponse(item, role);
    await replyWithSection(ctx, response.text, response.keyboard);
    return;
  }

  if (item.type === 'external_link' || item.type === 'link') {
    await sendCatalogLink(ctx, item);
    return;
  }

  if (item.type === 'request_action' || item.type === 'request') {
    await handleCatalogRequestItem(ctx, item, role);
    return;
  }

  if (item.type === 'pdf') {
    const response = await sendCatalogPdfAsset(ctx, item);
    await replyWithSection(ctx, response.text, response.keyboard);
    return;
  }

  if (item.type === 'placeholder') {
    await replyWithSection(ctx, `Каталог «${item.title}» скоро появится.`, await getCatalogListKeyboard(role));
    return;
  }

  logger.warn('Unsupported catalog item type.', {
    userId: ctx.from?.id,
    itemId: item.id,
    type: item.type,
  });
  await handleCatalog(ctx);
}

function createCatalogItemHandler(itemId) {
  return async (ctx) => {
    const role = await ensureAllowedRole(ctx, [USER_ROLES.CUSTOMER, USER_ROLES.DESIGNER]);

    if (!role) {
      return;
    }

    const item = await getCatalogItemById(itemId);

    if (!item) {
      logger.warn('Catalog item not found.', { itemId, userId: ctx.from?.id });
      await handleCatalog(ctx);
      return;
    }

    await handleCatalogItem(ctx, item, role);
  };
}

async function handleCatalogTextSelection(ctx, next) {
  const text = ctx.message?.text;

  if (!text) {
    return next();
  }

  const role = getUserRole(ctx);

  if (![USER_ROLES.CUSTOMER, USER_ROLES.DESIGNER].includes(role)) {
    return next();
  }

  const currentParentId = getCatalogCurrentParentId(ctx);
  const item = await getCatalogItemByTitle(text, role, currentParentId);

  if (!item) {
    return next();
  }

  await handleCatalogItem(ctx, item, role);

  return undefined;
}

module.exports = {
  handleCatalogTextSelection,
  handleCatalog,
  handleCatalogBack,
  createCatalogItemHandler,
};
