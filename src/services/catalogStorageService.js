const fs = require('fs/promises');
const path = require('path');

const { CATALOGS } = require('../config/catalogs');
const { logger } = require('../config/logger');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const CATALOGS_FILE_PATH = path.join(DATA_DIR, 'catalogs.json');

const TYPE_ALIASES = Object.freeze({
  link: 'external_link',
  request: 'request_action',
});

const VALID_TYPES = Object.freeze([
  'pdf',
  'external_link',
  'submenu',
  'request_action',
  'placeholder',
]);

const CATEGORY_BY_ID_PART = Object.freeze([
  ['ready', 'ready_furniture'],
  ['custom', 'custom_furniture'],
  ['wall', 'wall_panels'],
  ['appliances', 'appliances'],
  ['designer', 'designer_catalogs'],
]);

let catalogsCache = null;
let isInitialized = false;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeType(type) {
  const normalizedType = normalizeText(type);
  const resolvedType = TYPE_ALIASES[normalizedType] || normalizedType;

  return VALID_TYPES.includes(resolvedType) ? resolvedType : 'placeholder';
}

function normalizeAudience(audience) {
  const normalizedAudience = normalizeText(audience);

  if (['customer', 'designer', 'both'].includes(normalizedAudience)) {
    return normalizedAudience;
  }

  return 'both';
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'on', 'active'].includes(normalizedValue)) {
      return true;
    }

    if (['false', '0', 'no', 'off', 'inactive'].includes(normalizedValue)) {
      return false;
    }
  }

  return fallback;
}

function normalizeSortOrder(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isInteger(numericValue) ? numericValue : fallback;
}

function inferCategoryFromId(id = '') {
  const normalizedId = normalizeText(id).toLowerCase();
  const idParts = normalizedId.split(/[-_]/).filter(Boolean);
  const matchedPair = CATEGORY_BY_ID_PART.find(([idPart]) => idParts.includes(idPart));

  return matchedPair ? matchedPair[1] : 'ready_furniture';
}

function normalizeCatalog(rawCatalog = {}, index = 0) {
  const id = normalizeText(rawCatalog.id) || `catalog-${Date.now()}-${index}`;
  const title = normalizeText(rawCatalog.title) || 'Без названия';
  const category = normalizeText(rawCatalog.category) || inferCategoryFromId(id);

  const catalog = {
    id,
    title,
    category,
    type: normalizeType(rawCatalog.type),
    telegramFileId: normalizeText(rawCatalog.telegramFileId),
    pdfPath: normalizeText(rawCatalog.pdfPath),
    url: normalizeText(rawCatalog.url),
    isActive: normalizeBoolean(rawCatalog.isActive, true),
    audience: normalizeAudience(rawCatalog.audience),
    parentId: normalizeText(rawCatalog.parentId),
    sortOrder: normalizeSortOrder(rawCatalog.sortOrder, (index + 1) * 10),
  };

  if (typeof rawCatalog.description === 'string') {
    catalog.description = rawCatalog.description;
  }

  if (typeof rawCatalog.form === 'string') {
    catalog.form = rawCatalog.form;
  }

  return catalog;
}

function compareCatalogs(firstCatalog, secondCatalog) {
  if (firstCatalog.parentId !== secondCatalog.parentId) {
    return firstCatalog.parentId.localeCompare(secondCatalog.parentId, 'ru');
  }

  if (firstCatalog.sortOrder !== secondCatalog.sortOrder) {
    return firstCatalog.sortOrder - secondCatalog.sortOrder;
  }

  return firstCatalog.title.localeCompare(secondCatalog.title, 'ru');
}

function normalizeCatalogs(catalogs = []) {
  const usedIds = new Set();

  return catalogs
    .map((catalog, index) => {
      const normalizedCatalog = normalizeCatalog(catalog, index);

      if (usedIds.has(normalizedCatalog.id)) {
        const originalId = normalizedCatalog.id;
        normalizedCatalog.id = `${originalId}-${index + 1}`;
        logger.warn('Duplicate catalog id found. A suffix was added.', {
          originalId,
          newId: normalizedCatalog.id,
        });
      }

      usedIds.add(normalizedCatalog.id);

      return normalizedCatalog;
    })
    .sort(compareCatalogs);
}

function flattenBaseCatalogs(items, parentId = '', category = '') {
  return items.flatMap((item, index) => {
    const itemCategory = normalizeText(item.category) || category || inferCategoryFromId(item.id);
    const normalizedItem = normalizeCatalog(
      {
        ...item,
        category: itemCategory,
        parentId,
        isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : (index + 1) * 10,
      },
      index,
    );

    return [
      normalizedItem,
      ...flattenBaseCatalogs(item.children || [], item.id, itemCategory),
    ];
  });
}

function getBaseCatalogs() {
  return normalizeCatalogs(flattenBaseCatalogs(CATALOGS));
}

function extractCatalogsFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.catalogs)) {
    return payload.catalogs;
  }

  return null;
}

function cloneCatalogs(catalogs) {
  return catalogs.map((catalog) => ({ ...catalog }));
}

async function writeCatalogsFile(catalogs) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const normalizedCatalogs = normalizeCatalogs(catalogs);
  const temporaryFilePath = `${CATALOGS_FILE_PATH}.tmp`;
  const fileContent = `${JSON.stringify(normalizedCatalogs, null, 2)}\n`;

  await fs.writeFile(temporaryFilePath, fileContent, 'utf8');
  await fs.rename(temporaryFilePath, CATALOGS_FILE_PATH);

  return normalizedCatalogs;
}

async function readCatalogsFile() {
  try {
    const fileContent = await fs.readFile(CATALOGS_FILE_PATH, 'utf8');
    const parsedPayload = JSON.parse(fileContent);
    const catalogs = extractCatalogsFromPayload(parsedPayload);

    if (!catalogs) {
      logger.error('Catalog storage JSON has an unsupported structure.', {
        path: CATALOGS_FILE_PATH,
      });
      return null;
    }

    return normalizeCatalogs(catalogs);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    logger.error('Failed to read catalog storage JSON. Falling back to base config.', {
      path: CATALOGS_FILE_PATH,
      message: error.message,
    });
    return null;
  }
}

async function initializeCatalogStorage() {
  if (isInitialized) {
    return cloneCatalogs(catalogsCache);
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  const catalogsFromFile = await readCatalogsFile();

  if (catalogsFromFile) {
    catalogsCache = catalogsFromFile;
    isInitialized = true;
    logger.info('Catalog storage loaded from JSON file.', {
      path: CATALOGS_FILE_PATH,
      count: catalogsCache.length,
    });

    return cloneCatalogs(catalogsCache);
  }

  const baseCatalogs = getBaseCatalogs();

  try {
    await fs.access(CATALOGS_FILE_PATH);
    catalogsCache = baseCatalogs;
    logger.warn('Catalog storage file exists but could not be used. Base config is used in memory.');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.warn('Could not check catalog storage file. Base config is used in memory.', {
        path: CATALOGS_FILE_PATH,
        message: error.message,
      });
      catalogsCache = baseCatalogs;
    } else {
      catalogsCache = await writeCatalogsFile(baseCatalogs);
      logger.info('Catalog storage JSON file was created from base config.', {
        path: CATALOGS_FILE_PATH,
        count: catalogsCache.length,
      });
    }
  }

  isInitialized = true;

  return cloneCatalogs(catalogsCache);
}

async function readCatalogs() {
  if (!isInitialized) {
    await initializeCatalogStorage();
  }

  return cloneCatalogs(catalogsCache);
}

async function saveCatalogs(catalogs) {
  catalogsCache = await writeCatalogsFile(catalogs);
  isInitialized = true;

  logger.info('Catalog storage JSON file was updated.', {
    path: CATALOGS_FILE_PATH,
    count: catalogsCache.length,
  });

  return cloneCatalogs(catalogsCache);
}

async function findById(id) {
  const normalizedId = normalizeText(id);
  const catalogs = await readCatalogs();

  return catalogs.find((catalog) => catalog.id === normalizedId) || null;
}

async function createCatalog(catalog) {
  const catalogs = await readCatalogs();
  const normalizedCatalog = normalizeCatalog(catalog, catalogs.length);

  if (catalogs.some((existingCatalog) => existingCatalog.id === normalizedCatalog.id)) {
    throw new Error(`Catalog with id "${normalizedCatalog.id}" already exists.`);
  }

  await saveCatalogs([...catalogs, normalizedCatalog]);

  return normalizedCatalog;
}

async function updateById(id, patch) {
  const normalizedId = normalizeText(id);
  const catalogs = await readCatalogs();
  const catalogIndex = catalogs.findIndex((catalog) => catalog.id === normalizedId);

  if (catalogIndex === -1) {
    return null;
  }

  const previousCatalog = catalogs[catalogIndex];
  const nextCatalog = normalizeCatalog({
    ...previousCatalog,
    ...patch,
  }, catalogIndex);

  if (
    nextCatalog.id !== previousCatalog.id &&
    catalogs.some((catalog) => catalog.id === nextCatalog.id)
  ) {
    throw new Error(`Catalog with id "${nextCatalog.id}" already exists.`);
  }

  const updatedCatalogs = catalogs.map((catalog, index) => {
    if (index === catalogIndex) {
      return nextCatalog;
    }

    if (catalog.parentId === previousCatalog.id) {
      return {
        ...catalog,
        parentId: nextCatalog.id,
      };
    }

    return catalog;
  });

  await saveCatalogs(updatedCatalogs);

  return nextCatalog;
}

function getDescendantIds(catalogs, id) {
  const idsToDelete = new Set([id]);
  let hasNewDescendants = true;

  while (hasNewDescendants) {
    hasNewDescendants = false;

    catalogs.forEach((catalog) => {
      if (idsToDelete.has(catalog.parentId) && !idsToDelete.has(catalog.id)) {
        idsToDelete.add(catalog.id);
        hasNewDescendants = true;
      }
    });
  }

  return idsToDelete;
}

async function deleteById(id) {
  const normalizedId = normalizeText(id);
  const catalogs = await readCatalogs();

  if (!catalogs.some((catalog) => catalog.id === normalizedId)) {
    return {
      deletedCount: 0,
      deletedIds: [],
    };
  }

  const idsToDelete = getDescendantIds(catalogs, normalizedId);
  const nextCatalogs = catalogs.filter((catalog) => !idsToDelete.has(catalog.id));

  await saveCatalogs(nextCatalogs);

  return {
    deletedCount: idsToDelete.size,
    deletedIds: Array.from(idsToDelete),
  };
}

function isAudienceAllowed(catalog, audience) {
  return !audience || catalog.audience === audience || catalog.audience === 'both';
}

async function filterCatalogs(filters = {}) {
  const catalogs = await readCatalogs();
  const hasParentFilter = Object.prototype.hasOwnProperty.call(filters, 'parentId');
  const parentId = normalizeText(filters.parentId);

  return catalogs.filter((catalog) => {
    if (filters.activeOnly && !catalog.isActive) {
      return false;
    }

    if (filters.audience && !isAudienceAllowed(catalog, filters.audience)) {
      return false;
    }

    if (filters.category && catalog.category !== filters.category) {
      return false;
    }

    if (hasParentFilter && catalog.parentId !== parentId) {
      return false;
    }

    return true;
  });
}

async function filterActive(filters = {}) {
  return filterCatalogs({
    ...filters,
    activeOnly: true,
  });
}

async function getNextSortOrder(parentId = '') {
  const siblings = await filterCatalogs({ parentId });
  const maxSortOrder = siblings.reduce(
    (maxValue, catalog) => Math.max(maxValue, catalog.sortOrder),
    0,
  );

  return maxSortOrder + 10;
}

module.exports = {
  CATALOGS_FILE_PATH,
  VALID_TYPES,
  createCatalog,
  deleteById,
  filterActive,
  filterCatalogs,
  findById,
  getNextSortOrder,
  initializeCatalogStorage,
  normalizeType,
  readCatalogs,
  saveCatalogs,
  updateById,
};
