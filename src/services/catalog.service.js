const { CUSTOMER_MENU_BUTTONS, DESIGNER_MENU_BUTTONS } = require('../constants/buttons');
const { SCENE_IDS } = require('../constants/scenes');
const { SECTION_TEXTS } = require('../constants/section-texts');
const { USER_ROLES } = require('../constants/user-roles');
const { buildCatalogKeyboard } = require('../keyboards/catalog.keyboard');
const { catalogPdfActionsKeyboard } = require('../keyboards/catalog-pdf-actions.keyboard');
const { createSectionActionsKeyboard } = require('../keyboards/section-actions.keyboard');
const {
  filterActive,
  findById,
  readCatalogs,
} = require('./catalogStorageService');
const { sendCatalogPdf } = require('./catalog-pdf.service');

const CATALOG_NAVIGATION_SESSION_KEY = 'catalogNavigation';

function compareCatalogs(firstCatalog, secondCatalog) {
  if (firstCatalog.sortOrder !== secondCatalog.sortOrder) {
    return firstCatalog.sortOrder - secondCatalog.sortOrder;
  }

  return firstCatalog.title.localeCompare(secondCatalog.title, 'ru');
}

function flattenItems(items) {
  return items.flatMap((item) => [item, ...flattenItems(item.children || [])]);
}

function buildCatalogTree(catalogs) {
  const nodeById = new Map(
    catalogs.map((catalog) => [
      catalog.id,
      {
        ...catalog,
        children: [],
      },
    ]),
  );
  const rootItems = [];

  catalogs.forEach((catalog) => {
    const node = nodeById.get(catalog.id);

    if (catalog.parentId && nodeById.has(catalog.parentId)) {
      nodeById.get(catalog.parentId).children.push(node);
      return;
    }

    if (!catalog.parentId) {
      rootItems.push(node);
    }
  });

  const sortChildren = (item) => {
    item.children.sort(compareCatalogs);
    item.children.forEach(sortChildren);
  };

  rootItems.sort(compareCatalogs);
  rootItems.forEach(sortChildren);

  return rootItems;
}

function isAudienceAllowed(item, audience) {
  return item.audience === audience || item.audience === 'both';
}

function ensureCatalogNavigationState(ctx) {
  ctx.session = ctx.session || {};
  ctx.session[CATALOG_NAVIGATION_SESSION_KEY] =
    ctx.session[CATALOG_NAVIGATION_SESSION_KEY] || {};

  return ctx.session[CATALOG_NAVIGATION_SESSION_KEY];
}

function setCatalogCurrentParent(ctx, itemId = '') {
  const navigationState = ensureCatalogNavigationState(ctx);
  navigationState.currentParentItemId = itemId;
}

function getCatalogCurrentParentId(ctx) {
  return ctx.session?.[CATALOG_NAVIGATION_SESSION_KEY]?.currentParentItemId || '';
}

async function rememberCatalogBackTarget(ctx, item) {
  const navigationState = ensureCatalogNavigationState(ctx);
  const parent = await getCatalogParentItemById(item.id);

  navigationState.backTargetItemId = parent?.id || '';
}

function clearCatalogBackTarget(ctx) {
  const navigationState = ensureCatalogNavigationState(ctx);
  navigationState.backTargetItemId = '';
}

async function getRememberedCatalogBackTarget(ctx) {
  const itemId = ctx.session?.[CATALOG_NAVIGATION_SESSION_KEY]?.backTargetItemId;
  return itemId ? getCatalogItemById(itemId) : null;
}

async function getActiveCatalogTree(audience) {
  const catalogs = await filterActive();
  const allowedCatalogs = audience
    ? catalogs.filter((catalog) => isAudienceAllowed(catalog, audience))
    : catalogs;

  return buildCatalogTree(allowedCatalogs);
}

async function getTopLevelCatalogItems(audience) {
  return getActiveCatalogTree(audience);
}

async function getCatalogItemById(itemId) {
  const activeCatalogTree = await getActiveCatalogTree();

  return flattenItems(activeCatalogTree).find((item) => item.id === itemId) || null;
}

async function getCatalogItemByTitle(title, role, parentId = '') {
  const siblings = await filterActive({
    audience: role,
    parentId,
  });
  const matchedSibling = siblings.find((item) => item.title === title);

  if (matchedSibling) {
    return getCatalogItemById(matchedSibling.id);
  }

  const activeCatalogTree = await getActiveCatalogTree(role);

  return flattenItems(activeCatalogTree).find((item) => item.title === title) || null;
}

async function getCatalogParentItemById(itemId) {
  const catalog = await findById(itemId);

  if (!catalog?.parentId) {
    return null;
  }

  return getCatalogItemById(catalog.parentId);
}

async function getAllCatalogItems() {
  const catalogs = await readCatalogs();

  return catalogs;
}

function isCatalogItemAllowedForRole(item, role) {
  return Boolean(item && item.isActive !== false && isAudienceAllowed(item, role));
}

function getCatalogIntroMessage(audience) {
  return audience === USER_ROLES.DESIGNER
    ? SECTION_TEXTS.designerCatalogsIntro
    : SECTION_TEXTS.customerCatalogsIntro;
}

function getCatalogFallbackActions(audience) {
  return audience === USER_ROLES.DESIGNER
    ? [DESIGNER_MENU_BUTTONS.PROJECT_REQUEST]
    : [CUSTOMER_MENU_BUTTONS.REQUEST];
}

async function getCatalogListKeyboard(audience) {
  return buildCatalogKeyboard(await getTopLevelCatalogItems(audience));
}

function buildCatalogSubmenuResponse(item, role = item.audience) {
  const allowedChildren = (item.children || []).filter((child) => isAudienceAllowed(child, role));

  return {
    text: SECTION_TEXTS.catalogSubmenu(item.title),
    keyboard: buildCatalogKeyboard(allowedChildren, getCatalogFallbackActions(role)),
  };
}

function getCatalogRequestSceneId(item, role) {
  if (item.form === 'customer_request') {
    return SCENE_IDS.CUSTOMER_REQUEST;
  }

  if (item.form === 'designer_project_request') {
    return SCENE_IDS.DESIGNER_PROJECT_REQUEST;
  }

  if (role === USER_ROLES.DESIGNER || item.audience === USER_ROLES.DESIGNER) {
    return SCENE_IDS.DESIGNER_PROJECT_REQUEST;
  }

  return SCENE_IDS.CUSTOMER_REQUEST;
}

function buildCatalogRequestResponse(item) {
  return {
    text: SECTION_TEXTS.catalogRequest(item.title),
    keyboard: createSectionActionsKeyboard(getCatalogFallbackActions(item.audience)),
  };
}

async function sendCatalogPdfAsset(ctx, item) {
  await rememberCatalogBackTarget(ctx, item);

  const result = await sendCatalogPdf(ctx, item);

  return {
    text: result.isSent
      ? SECTION_TEXTS.catalogPdfSent(item.title)
      : SECTION_TEXTS.catalogPdfUnavailable(item.title),
    keyboard: catalogPdfActionsKeyboard,
    isSent: result.isSent,
    source: result.source,
  };
}

module.exports = {
  buildCatalogRequestResponse,
  buildCatalogSubmenuResponse,
  clearCatalogBackTarget,
  getAllCatalogItems,
  getCatalogCurrentParentId,
  getCatalogIntroMessage,
  getCatalogItemById,
  getCatalogItemByTitle,
  getCatalogListKeyboard,
  getCatalogParentItemById,
  getCatalogRequestSceneId,
  getRememberedCatalogBackTarget,
  getTopLevelCatalogItems,
  isCatalogItemAllowedForRole,
  sendCatalogPdfAsset,
  setCatalogCurrentParent,
};
