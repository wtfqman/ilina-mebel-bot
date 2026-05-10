const { logger } = require('../config/logger');
const {
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
} = require('../keyboards/catalog-admin.keyboard');
const { isAdminUser } = require('../services/admin-access.service');
const {
  createCatalog,
  deleteById,
  findById,
  getNextSortOrder,
  normalizeType,
  readCatalogs,
  updateById,
} = require('../services/catalogStorageService');
const { replyWithMainMenu } = require('../services/navigation.service');
const { withErrorBoundary } = require('../utils/async-handler');

const ADMIN_SESSION_KEY = 'catalogAdmin';
const EMPTY_VALUE = '(пусто)';
const ACCESS_DENIED_MESSAGE = 'Доступ к админ-разделу закрыт.';

const CYRILLIC_TO_LATIN = Object.freeze({
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
});

function ensureAdminSession(ctx) {
  ctx.session = ctx.session || {};
  ctx.session[ADMIN_SESSION_KEY] = ctx.session[ADMIN_SESSION_KEY] || {};

  return ctx.session[ADMIN_SESSION_KEY];
}

function setAdminSession(ctx, sessionPatch = {}) {
  ctx.session = ctx.session || {};
  ctx.session[ADMIN_SESSION_KEY] = {
    ...sessionPatch,
  };

  return ctx.session[ADMIN_SESSION_KEY];
}

function clearAdminSession(ctx) {
  if (ctx.session) {
    delete ctx.session[ADMIN_SESSION_KEY];
  }
}

function getAdminSession(ctx) {
  return ctx.session?.[ADMIN_SESSION_KEY] || null;
}

function isAdminSessionActive(ctx) {
  return Boolean(getAdminSession(ctx)?.mode);
}

async function ensureAdminAccess(ctx, { answerCallback = false } = {}) {
  if (isAdminUser(ctx.from?.id)) {
    return true;
  }

  clearAdminSession(ctx);

  if (answerCallback && ctx.answerCbQuery) {
    await ctx.answerCbQuery(ACCESS_DENIED_MESSAGE);
  }

  await ctx.reply(ACCESS_DENIED_MESSAGE);

  return false;
}

function normalizeInput(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isSkipInput(value) {
  const normalizedValue = normalizeInput(value).toLowerCase();

  return normalizedValue === CATALOG_ADMIN_BUTTONS.SKIP.toLowerCase() || normalizedValue === '-';
}

function optionalInput(value) {
  return isSkipInput(value) ? '' : normalizeInput(value);
}

function formatValue(value) {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return normalizeInput(value) || EMPTY_VALUE;
}

function formatCatalogLine(catalog, index = 0) {
  const status = catalog.isActive ? 'active' : 'inactive';

  return [
    `${index + 1}. ${catalog.title}`,
    `id: ${catalog.id}`,
    `type: ${catalog.type}`,
    `category: ${catalog.category}`,
    `status: ${status}`,
  ].join('\n');
}

function formatCatalogDetails(catalog) {
  return [
    `title: ${formatValue(catalog.title)}`,
    `id: ${formatValue(catalog.id)}`,
    `category: ${formatValue(catalog.category)}`,
    `type: ${formatValue(catalog.type)}`,
    `telegramFileId: ${formatValue(catalog.telegramFileId)}`,
    `pdfPath: ${formatValue(catalog.pdfPath)}`,
    `url: ${formatValue(catalog.url)}`,
    `isActive: ${formatValue(catalog.isActive)}`,
    `audience: ${formatValue(catalog.audience)}`,
    `parentId: ${formatValue(catalog.parentId)}`,
    `sortOrder: ${formatValue(catalog.sortOrder)}`,
  ].join('\n');
}

function splitLongMessage(lines, limit = 3500) {
  const chunks = [];
  let currentChunk = '';

  lines.forEach((line) => {
    const nextChunk = currentChunk ? `${currentChunk}\n\n${line}` : line;

    if (nextChunk.length > limit && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = line;
      return;
    }

    currentChunk = nextChunk;
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function transliterate(value) {
  return normalizeInput(value)
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join('');
}

function slugify(value) {
  return transliterate(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createUniqueCatalogId(title, category) {
  const catalogs = await readCatalogs();
  const usedIds = new Set(catalogs.map((catalog) => catalog.id));
  const baseId = slugify(`${category}-${title}`) || `catalog-${Date.now()}`;
  let id = baseId;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function isValidId(value) {
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

function isValidUrl(value) {
  return /^https?:\/\/\S+$/i.test(value);
}

function parseBooleanInput(value) {
  const normalizedValue = normalizeInput(value).toLowerCase();

  if (['true', '1', 'yes', 'да', 'on', 'active', 'включить', 'включен'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', 'no', 'нет', 'off', 'inactive', 'выключить', 'выключен'].includes(normalizedValue)) {
    return false;
  }

  return null;
}

function parseIntegerInput(value) {
  const normalizedValue = normalizeInput(value);
  const numericValue = Number(normalizedValue);

  return Number.isInteger(numericValue) ? numericValue : null;
}

async function validateParentId(parentId, currentCatalogId = '') {
  if (!parentId) {
    return {
      isValid: true,
    };
  }

  if (parentId === currentCatalogId) {
    return {
      isValid: false,
      message: 'parentId не может совпадать с id текущего каталога.',
    };
  }

  const parentCatalog = await findById(parentId);

  if (!parentCatalog) {
    return {
      isValid: false,
      message: 'Каталог с таким parentId не найден. Введите существующий id или нажмите «Пропустить».',
    };
  }

  const catalogs = await readCatalogs();
  let cursor = parentCatalog;

  while (cursor?.parentId) {
    if (cursor.parentId === currentCatalogId) {
      return {
        isValid: false,
        message: 'Такой parentId создаст циклическую вложенность.',
      };
    }

    cursor = catalogs.find((catalog) => catalog.id === cursor.parentId);
  }

  return {
    isValid: true,
  };
}

async function showAdminMenu(ctx, message = 'Админ-раздел каталогов.') {
  setAdminSession(ctx, { mode: 'menu' });

  await ctx.reply(message, buildCatalogAdminMenuKeyboard());
}

async function handleAdminCommand(ctx) {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  logger.info('Catalog admin panel opened.', { userId: ctx.from?.id });
  await showAdminMenu(ctx);
}

async function handleAdminBack(ctx, next) {
  if (!isAdminSessionActive(ctx)) {
    return next();
  }

  if (!(await ensureAdminAccess(ctx))) {
    return undefined;
  }

  clearAdminSession(ctx);
  await replyWithMainMenu(ctx, 'Вы вышли из админ-раздела.');

  return undefined;
}

async function startAddCatalog(ctx) {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  setAdminSession(ctx, {
    mode: 'add',
    step: 'title',
    draft: {
      isActive: true,
    },
  });

  await ctx.reply('Введите название каталога.', buildAdminCancelKeyboard());
}

async function askAddStep(ctx, step) {
  const prompts = {
    category: {
      text: 'Выберите category или введите своё значение.',
      keyboard: buildAdminOptionsKeyboard(CATALOG_CATEGORIES),
    },
    type: {
      text: 'Выберите type.',
      keyboard: buildAdminOptionsKeyboard(CATALOG_TYPES),
    },
    telegramFileId: {
      text: 'Введите telegramFileId для PDF.',
      keyboard: buildAdminCancelKeyboard(),
    },
    pdfPath: {
      text: 'Введите pdfPath относительно assets/catalogs или нажмите «Пропустить».',
      keyboard: buildAdminSkipCancelKeyboard(),
    },
    url: {
      text: 'Введите URL для external_link.',
      keyboard: buildAdminCancelKeyboard(),
    },
    audience: {
      text: 'Выберите audience.',
      keyboard: buildAdminOptionsKeyboard(CATALOG_AUDIENCES),
    },
    parentId: {
      text: 'Введите parentId или нажмите «Пропустить», если это верхний уровень.',
      keyboard: buildAdminSkipCancelKeyboard(),
    },
    sortOrder: {
      text: 'Введите sortOrder числом или нажмите «Пропустить» для автоматического значения.',
      keyboard: buildAdminSkipCancelKeyboard(),
    },
  };

  const prompt = prompts[step];

  await ctx.reply(prompt.text, prompt.keyboard);
}

async function finishAddCatalog(ctx) {
  const adminSession = ensureAdminSession(ctx);
  const draft = adminSession.draft || {};
  const id = await createUniqueCatalogId(draft.title, draft.category);
  const catalog = {
    id,
    title: draft.title,
    category: draft.category,
    type: draft.type,
    telegramFileId: draft.telegramFileId || '',
    pdfPath: draft.pdfPath || '',
    url: draft.url || '',
    isActive: true,
    audience: draft.audience,
    parentId: draft.parentId || '',
    sortOrder: draft.sortOrder,
  };

  const savedCatalog = await createCatalog(catalog);

  logger.info('Catalog was created from admin panel.', {
    userId: ctx.from?.id,
    id: savedCatalog.id,
  });

  await showAdminMenu(ctx, `Каталог сохранён.\n\n${formatCatalogDetails(savedCatalog)}`);
}

async function handleAddStep(ctx, text) {
  const adminSession = ensureAdminSession(ctx);
  const draft = adminSession.draft || {};

  if (adminSession.step === 'title') {
    const title = normalizeInput(text);

    if (!title) {
      await ctx.reply('Название не должно быть пустым.', buildAdminCancelKeyboard());
      return;
    }

    draft.title = title;
    adminSession.step = 'category';
    adminSession.draft = draft;
    await askAddStep(ctx, 'category');
    return;
  }

  if (adminSession.step === 'category') {
    const category = normalizeInput(text);

    if (!category) {
      await ctx.reply('category не должна быть пустой.', buildAdminOptionsKeyboard(CATALOG_CATEGORIES));
      return;
    }

    draft.category = category;
    adminSession.step = 'type';
    adminSession.draft = draft;
    await askAddStep(ctx, 'type');
    return;
  }

  if (adminSession.step === 'type') {
    const type = normalizeType(text);

    if (!CATALOG_TYPES.includes(type)) {
      await ctx.reply('Выберите type из списка.', buildAdminOptionsKeyboard(CATALOG_TYPES));
      return;
    }

    draft.type = type;
    adminSession.draft = draft;

    if (type === 'pdf') {
      adminSession.step = 'telegramFileId';
      await askAddStep(ctx, 'telegramFileId');
      return;
    }

    if (type === 'external_link') {
      adminSession.step = 'url';
      await askAddStep(ctx, 'url');
      return;
    }

    adminSession.step = 'audience';
    await askAddStep(ctx, 'audience');
    return;
  }

  if (adminSession.step === 'telegramFileId') {
    const telegramFileId = normalizeInput(text);

    if (!telegramFileId) {
      await ctx.reply('telegramFileId не должен быть пустым.', buildAdminCancelKeyboard());
      return;
    }

    draft.telegramFileId = telegramFileId;
    adminSession.step = 'pdfPath';
    adminSession.draft = draft;
    await askAddStep(ctx, 'pdfPath');
    return;
  }

  if (adminSession.step === 'pdfPath') {
    draft.pdfPath = optionalInput(text);
    adminSession.step = 'audience';
    adminSession.draft = draft;
    await askAddStep(ctx, 'audience');
    return;
  }

  if (adminSession.step === 'url') {
    const url = normalizeInput(text);

    if (!isValidUrl(url)) {
      await ctx.reply('Введите URL в формате http:// или https://.', buildAdminCancelKeyboard());
      return;
    }

    draft.url = url;
    adminSession.step = 'audience';
    adminSession.draft = draft;
    await askAddStep(ctx, 'audience');
    return;
  }

  if (adminSession.step === 'audience') {
    const audience = normalizeInput(text);

    if (!CATALOG_AUDIENCES.includes(audience)) {
      await ctx.reply('Выберите audience из списка.', buildAdminOptionsKeyboard(CATALOG_AUDIENCES));
      return;
    }

    draft.audience = audience;
    adminSession.step = 'parentId';
    adminSession.draft = draft;
    await askAddStep(ctx, 'parentId');
    return;
  }

  if (adminSession.step === 'parentId') {
    const parentId = optionalInput(text);
    const parentValidation = await validateParentId(parentId);

    if (!parentValidation.isValid) {
      await ctx.reply(parentValidation.message, buildAdminSkipCancelKeyboard());
      return;
    }

    draft.parentId = parentId;
    adminSession.step = 'sortOrder';
    adminSession.draft = draft;
    await askAddStep(ctx, 'sortOrder');
    return;
  }

  if (adminSession.step === 'sortOrder') {
    const sortOrder = isSkipInput(text)
      ? await getNextSortOrder(draft.parentId || '')
      : parseIntegerInput(text);

    if (sortOrder === null) {
      await ctx.reply('sortOrder должен быть целым числом.', buildAdminSkipCancelKeyboard());
      return;
    }

    draft.sortOrder = sortOrder;
    adminSession.draft = draft;
    await finishAddCatalog(ctx);
  }
}

async function showCatalogSelection(ctx, action, message) {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  const catalogs = await readCatalogs();

  if (catalogs.length === 0) {
    await showAdminMenu(ctx, 'Каталогов пока нет.');
    return;
  }

  setAdminSession(ctx, {
    mode: `select_${action}`,
    selection: {
      action,
      ids: catalogs.map((catalog) => catalog.id),
    },
  });

  await ctx.reply(message, buildCatalogSelectionInlineKeyboard(catalogs, action));
}

async function handleListCatalogs(ctx) {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  const catalogs = await readCatalogs();

  if (catalogs.length === 0) {
    await showAdminMenu(ctx, 'Каталогов пока нет.');
    return;
  }

  const lines = catalogs.map(formatCatalogLine);
  const chunks = splitLongMessage(lines);

  for (const chunk of chunks) {
    await ctx.reply(chunk);
  }

  await showAdminMenu(ctx, 'Список каталогов отправлен.');
}

async function showEditFieldMenu(ctx, catalogId, message = 'Выберите поле для изменения.') {
  const catalog = await findById(catalogId);

  if (!catalog) {
    await showAdminMenu(ctx, 'Каталог не найден.');
    return;
  }

  setAdminSession(ctx, {
    mode: 'editing',
    selectedId: catalog.id,
  });

  await ctx.reply(
    `${message}\n\n${formatCatalogDetails(catalog)}`,
    buildCatalogFieldInlineKeyboard(),
  );
}

async function handleSelectedCatalog(ctx, action, indexText) {
  const adminSession = getAdminSession(ctx);
  const index = Number(indexText);
  const catalogId = adminSession?.selection?.action === action
    ? adminSession.selection.ids[index]
    : '';

  if (!catalogId) {
    await showAdminMenu(ctx, 'Выбор устарел. Откройте список заново.');
    return;
  }

  const catalog = await findById(catalogId);

  if (!catalog) {
    await showAdminMenu(ctx, 'Каталог не найден.');
    return;
  }

  if (action === 'edit') {
    await showEditFieldMenu(ctx, catalog.id);
    return;
  }

  if (action === 'delete') {
    setAdminSession(ctx, {
      mode: 'confirm_delete',
      selectedId: catalog.id,
    });

    await ctx.reply(
      `Удалить каталог и все вложенные элементы?\n\n${formatCatalogDetails(catalog)}`,
      buildDeleteConfirmInlineKeyboard(),
    );
    return;
  }

  if (action === 'toggle') {
    const updatedCatalog = await updateById(catalog.id, {
      isActive: !catalog.isActive,
    });
    const status = updatedCatalog.isActive ? 'active' : 'inactive';

    logger.info('Catalog active state was toggled from admin panel.', {
      userId: ctx.from?.id,
      id: updatedCatalog.id,
      isActive: updatedCatalog.isActive,
    });

    await showAdminMenu(ctx, `Каталог «${updatedCatalog.title}» теперь ${status}.`);
  }
}

async function askEditFieldValue(ctx, field) {
  const adminSession = getAdminSession(ctx);
  const catalog = await findById(adminSession?.selectedId || '');

  if (!catalog) {
    await showAdminMenu(ctx, 'Каталог не найден.');
    return;
  }

  const currentValue = formatValue(catalog[field]);
  setAdminSession(ctx, {
    mode: 'edit_field',
    selectedId: catalog.id,
    field,
  });

  if (field === 'category') {
    await ctx.reply(
      `Текущее значение ${FIELD_LABELS[field]}: ${currentValue}\nВведите новое значение.`,
      buildAdminOptionsKeyboard(CATALOG_CATEGORIES),
    );
    return;
  }

  if (field === 'type') {
    await ctx.reply(
      `Текущее значение ${FIELD_LABELS[field]}: ${currentValue}\nВыберите новое значение.`,
      buildAdminOptionsKeyboard(CATALOG_TYPES),
    );
    return;
  }

  if (field === 'audience') {
    await ctx.reply(
      `Текущее значение ${FIELD_LABELS[field]}: ${currentValue}\nВыберите новое значение.`,
      buildAdminOptionsKeyboard(CATALOG_AUDIENCES),
    );
    return;
  }

  if (field === 'isActive') {
    await ctx.reply(
      `Текущее значение ${FIELD_LABELS[field]}: ${currentValue}\nВведите true или false.`,
      buildAdminOptionsKeyboard(['true', 'false']),
    );
    return;
  }

  if (['telegramFileId', 'pdfPath', 'url', 'parentId'].includes(field)) {
    await ctx.reply(
      `Текущее значение ${FIELD_LABELS[field]}: ${currentValue}\nВведите новое значение или нажмите «Пропустить», чтобы очистить поле.`,
      buildAdminSkipCancelKeyboard(),
    );
    return;
  }

  await ctx.reply(
    `Текущее значение ${FIELD_LABELS[field]}: ${currentValue}\nВведите новое значение.`,
    buildAdminCancelKeyboard(),
  );
}

async function parseFieldValue(ctx, field, text, catalog) {
  if (field === 'id') {
    const id = normalizeInput(text);

    if (!id || !isValidId(id)) {
      return {
        isValid: false,
        message: 'id должен содержать только латинские буквы, цифры, дефис или подчёркивание.',
      };
    }

    return {
      isValid: true,
      value: id,
    };
  }

  if (field === 'title') {
    const title = normalizeInput(text);

    if (!title) {
      return {
        isValid: false,
        message: 'title не должен быть пустым.',
      };
    }

    return {
      isValid: true,
      value: title,
    };
  }

  if (field === 'category') {
    const category = normalizeInput(text);

    if (!category) {
      return {
        isValid: false,
        message: 'category не должна быть пустой.',
      };
    }

    return {
      isValid: true,
      value: category,
    };
  }

  if (field === 'type') {
    const type = normalizeType(text);

    if (!CATALOG_TYPES.includes(type)) {
      return {
        isValid: false,
        message: 'Выберите type из списка.',
      };
    }

    return {
      isValid: true,
      value: type,
    };
  }

  if (field === 'isActive') {
    const parsedValue = parseBooleanInput(text);

    if (parsedValue === null) {
      return {
        isValid: false,
        message: 'Введите true или false.',
      };
    }

    return {
      isValid: true,
      value: parsedValue,
    };
  }

  if (field === 'audience') {
    const audience = normalizeInput(text);

    if (!CATALOG_AUDIENCES.includes(audience)) {
      return {
        isValid: false,
        message: 'Выберите audience из списка.',
      };
    }

    return {
      isValid: true,
      value: audience,
    };
  }

  if (field === 'parentId') {
    const parentId = optionalInput(text);
    const parentValidation = await validateParentId(parentId, catalog.id);

    if (!parentValidation.isValid) {
      return {
        isValid: false,
        message: parentValidation.message,
      };
    }

    return {
      isValid: true,
      value: parentId,
    };
  }

  if (field === 'sortOrder') {
    const sortOrder = parseIntegerInput(text);

    if (sortOrder === null) {
      return {
        isValid: false,
        message: 'sortOrder должен быть целым числом.',
      };
    }

    return {
      isValid: true,
      value: sortOrder,
    };
  }

  if (field === 'url') {
    const url = optionalInput(text);

    if (url && !isValidUrl(url)) {
      return {
        isValid: false,
        message: 'Введите URL в формате http:// или https://.',
      };
    }

    return {
      isValid: true,
      value: url,
    };
  }

  return {
    isValid: true,
    value: optionalInput(text),
  };
}

async function handleEditFieldValue(ctx, text) {
  const adminSession = getAdminSession(ctx);
  const field = adminSession?.field;
  const catalog = await findById(adminSession?.selectedId || '');

  if (!catalog || !EDITABLE_CATALOG_FIELDS.includes(field)) {
    await showAdminMenu(ctx, 'Редактирование устарело. Откройте каталог заново.');
    return;
  }

  const parsedField = await parseFieldValue(ctx, field, text, catalog);

  if (!parsedField.isValid) {
    await ctx.reply(parsedField.message);
    await askEditFieldValue(ctx, field);
    return;
  }

  const updatedCatalog = await updateById(catalog.id, {
    [field]: parsedField.value,
  });

  logger.info('Catalog field was updated from admin panel.', {
    userId: ctx.from?.id,
    id: updatedCatalog.id,
    field,
  });

  await showEditFieldMenu(ctx, updatedCatalog.id, 'Поле обновлено. Можно изменить ещё одно поле.');
}

async function handleDeleteConfirmation(ctx, decision) {
  const adminSession = getAdminSession(ctx);
  const catalogId = adminSession?.selectedId || '';

  if (!catalogId) {
    await showAdminMenu(ctx, 'Удаление устарело. Откройте список заново.');
    return;
  }

  if (decision !== 'yes') {
    await showAdminMenu(ctx, 'Удаление отменено.');
    return;
  }

  const result = await deleteById(catalogId);

  logger.info('Catalog was deleted from admin panel.', {
    userId: ctx.from?.id,
    id: catalogId,
    deletedCount: result.deletedCount,
  });

  await showAdminMenu(ctx, `Удалено элементов: ${result.deletedCount}.`);
}

async function handleAdminCallback(ctx) {
  if (!(await ensureAdminAccess(ctx, { answerCallback: true }))) {
    return;
  }

  const data = ctx.callbackQuery?.data || '';
  await ctx.answerCbQuery();

  if (data === 'catalog_admin:menu') {
    await showAdminMenu(ctx);
    return;
  }

  const selectMatch = data.match(/^catalog_admin:select:(edit|delete|toggle):(\d+)$/);

  if (selectMatch) {
    await handleSelectedCatalog(ctx, selectMatch[1], selectMatch[2]);
    return;
  }

  const fieldMatch = data.match(/^catalog_admin:field:([a-zA-Z]+)$/);

  if (fieldMatch) {
    const field = fieldMatch[1];

    if (!EDITABLE_CATALOG_FIELDS.includes(field)) {
      await showAdminMenu(ctx, 'Неизвестное поле.');
      return;
    }

    await askEditFieldValue(ctx, field);
    return;
  }

  const deleteMatch = data.match(/^catalog_admin:delete:(yes|no)$/);

  if (deleteMatch) {
    await handleDeleteConfirmation(ctx, deleteMatch[1]);
  }
}

async function handleAdminTextInput(ctx, next) {
  const text = normalizeInput(ctx.message?.text);
  const adminSession = getAdminSession(ctx);

  if (!text || !adminSession?.mode) {
    return next();
  }

  if (!['add', 'edit_field'].includes(adminSession.mode)) {
    return next();
  }

  if (!(await ensureAdminAccess(ctx))) {
    return undefined;
  }

  if (text === CATALOG_ADMIN_BUTTONS.CANCEL) {
    await showAdminMenu(ctx, 'Действие отменено.');
    return undefined;
  }

  if (adminSession.mode === 'add') {
    await handleAddStep(ctx, text);
    return undefined;
  }

  if (adminSession.mode === 'edit_field') {
    await handleEditFieldValue(ctx, text);
  }

  return undefined;
}

function registerCatalogAdminHandlers(bot) {
  bot.command(['admin', 'catalog_admin'], withErrorBoundary(handleAdminCommand));

  bot.hears(CATALOG_ADMIN_BUTTONS.ADD, withErrorBoundary(startAddCatalog));
  bot.hears(
    CATALOG_ADMIN_BUTTONS.EDIT,
    withErrorBoundary((ctx) => showCatalogSelection(ctx, 'edit', 'Выберите каталог для изменения.')),
  );
  bot.hears(
    CATALOG_ADMIN_BUTTONS.DELETE,
    withErrorBoundary((ctx) => showCatalogSelection(ctx, 'delete', 'Выберите каталог для удаления.')),
  );
  bot.hears(
    CATALOG_ADMIN_BUTTONS.TOGGLE,
    withErrorBoundary((ctx) => showCatalogSelection(ctx, 'toggle', 'Выберите каталог для переключения активности.')),
  );
  bot.hears(CATALOG_ADMIN_BUTTONS.LIST, withErrorBoundary(handleListCatalogs));
  bot.hears(CATALOG_ADMIN_BUTTONS.BACK, withErrorBoundary(handleAdminBack));
  bot.action(/^catalog_admin:/, withErrorBoundary(handleAdminCallback));
  bot.on('text', withErrorBoundary(handleAdminTextInput));
}

module.exports = {
  registerCatalogAdminHandlers,
};
