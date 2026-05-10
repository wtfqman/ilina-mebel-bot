const { Markup } = require('telegraf');

const { buildReplyKeyboard } = require('./build-reply-keyboard');

const CATALOG_ADMIN_BUTTONS = Object.freeze({
  ADD: 'Добавить каталог',
  EDIT: 'Изменить каталог',
  DELETE: 'Удалить каталог',
  LIST: 'Список каталогов',
  TOGGLE: 'Включить / выключить каталог',
  BACK: 'Назад',
  CANCEL: 'Отмена',
  SKIP: 'Пропустить',
  YES_DELETE: 'Удалить',
  NO_DELETE: 'Отмена',
});

const CATALOG_CATEGORIES = Object.freeze([
  'ready_furniture',
  'custom_furniture',
  'wall_panels',
  'appliances',
  'designer_catalogs',
]);

const CATALOG_TYPES = Object.freeze([
  'pdf',
  'external_link',
  'submenu',
  'request_action',
  'placeholder',
]);

const CATALOG_AUDIENCES = Object.freeze([
  'customer',
  'designer',
  'both',
]);

const EDITABLE_CATALOG_FIELDS = Object.freeze([
  'id',
  'title',
  'category',
  'type',
  'telegramFileId',
  'pdfPath',
  'url',
  'isActive',
  'audience',
  'parentId',
  'sortOrder',
]);

const FIELD_LABELS = Object.freeze({
  id: 'id',
  title: 'title',
  category: 'category',
  type: 'type',
  telegramFileId: 'telegramFileId',
  pdfPath: 'pdfPath',
  url: 'url',
  isActive: 'isActive',
  audience: 'audience',
  parentId: 'parentId',
  sortOrder: 'sortOrder',
});

function chunkRows(items, chunkSize = 2) {
  const rows = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    rows.push(items.slice(index, index + chunkSize));
  }

  return rows;
}

function buildCatalogAdminMenuKeyboard() {
  return buildReplyKeyboard([
    [CATALOG_ADMIN_BUTTONS.ADD, CATALOG_ADMIN_BUTTONS.EDIT],
    [CATALOG_ADMIN_BUTTONS.DELETE, CATALOG_ADMIN_BUTTONS.LIST],
    [CATALOG_ADMIN_BUTTONS.TOGGLE],
    [CATALOG_ADMIN_BUTTONS.BACK],
  ]);
}

function buildAdminCancelKeyboard() {
  return buildReplyKeyboard([[CATALOG_ADMIN_BUTTONS.CANCEL]]);
}

function buildAdminSkipCancelKeyboard() {
  return buildReplyKeyboard([[CATALOG_ADMIN_BUTTONS.SKIP, CATALOG_ADMIN_BUTTONS.CANCEL]]);
}

function buildAdminOptionsKeyboard(options, { includeSkip = false } = {}) {
  const rows = chunkRows(options);

  if (includeSkip) {
    rows.push([CATALOG_ADMIN_BUTTONS.SKIP, CATALOG_ADMIN_BUTTONS.CANCEL]);
  } else {
    rows.push([CATALOG_ADMIN_BUTTONS.CANCEL]);
  }

  return buildReplyKeyboard(rows);
}

function truncateButtonText(text, maxLength = 54) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

function formatCatalogSelectButton(catalog, index) {
  const status = catalog.isActive ? 'active' : 'inactive';

  return truncateButtonText(`${index + 1}. ${catalog.title} (${status})`);
}

function buildCatalogSelectionInlineKeyboard(catalogs, action) {
  const rows = catalogs.map((catalog, index) => [
    Markup.button.callback(
      formatCatalogSelectButton(catalog, index),
      `catalog_admin:select:${action}:${index}`,
    ),
  ]);

  rows.push([
    Markup.button.callback(CATALOG_ADMIN_BUTTONS.BACK, 'catalog_admin:menu'),
  ]);

  return Markup.inlineKeyboard(rows);
}

function buildCatalogFieldInlineKeyboard() {
  const rows = chunkRows(
    EDITABLE_CATALOG_FIELDS.map((field) => (
      Markup.button.callback(FIELD_LABELS[field], `catalog_admin:field:${field}`)
    )),
  );

  rows.push([
    Markup.button.callback(CATALOG_ADMIN_BUTTONS.BACK, 'catalog_admin:menu'),
  ]);

  return Markup.inlineKeyboard(rows);
}

function buildDeleteConfirmInlineKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(CATALOG_ADMIN_BUTTONS.YES_DELETE, 'catalog_admin:delete:yes'),
      Markup.button.callback(CATALOG_ADMIN_BUTTONS.NO_DELETE, 'catalog_admin:delete:no'),
    ],
  ]);
}

module.exports = {
  CATALOG_ADMIN_BUTTONS,
  CATALOG_AUDIENCES,
  CATALOG_CATEGORIES,
  CATALOG_TYPES,
  EDITABLE_CATALOG_FIELDS,
  FIELD_LABELS,
  buildAdminCancelKeyboard,
  buildAdminOptionsKeyboard,
  buildAdminSkipCancelKeyboard,
  buildCatalogAdminMenuKeyboard,
  buildCatalogFieldInlineKeyboard,
  buildCatalogSelectionInlineKeyboard,
  buildDeleteConfirmInlineKeyboard,
};
