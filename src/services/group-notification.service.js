const { config } = require('../config/env');
const { logger } = require('../config/logger');

function buildRequestLeadMessage(payload = {}) {
  return [
    'Новая заявка от заказчика',
    `Имя: ${payload.name || '—'}`,
    `Телефон: ${payload.phone || '—'}`,
    `Запрос: ${payload.requestText || '—'}`,
    `Username: ${payload.username || '—'}`,
    `User ID: ${payload.userId || '—'}`,
    `Дата: ${payload.date || '—'}`,
  ].join('\n');
}

function buildConsultationLeadMessage(payload = {}) {
  return [
    'Новая запись на консультацию',
    `Роль: ${payload.role || '—'}`,
    `Имя: ${payload.name || '—'}`,
    `Телефон: ${payload.phone || '—'}`,
    `Город: ${payload.city || '—'}`,
    `Менеджер: ${payload.manager || '—'}`,
    `Удобное время: ${payload.convenientTime || '—'}`,
    `Username: ${payload.username || '—'}`,
    `User ID: ${payload.userId || '—'}`,
    `Дата: ${payload.date || '—'}`,
  ].join('\n');
}

function buildDesignerLeadMessage(payload = {}) {
  return [
    'Новый дизайнер',
    `ФИО: ${payload.fullName || '—'}`,
    `Контакты: ${payload.contacts || '—'}`,
    `Сертификат / обучение: ${payload.certification || '—'}`,
    `Username: ${payload.username || '—'}`,
    `User ID: ${payload.userId || '—'}`,
    `Дата: ${payload.date || '—'}`,
  ].join('\n');
}

function buildDesignerProjectLeadMessage(payload = {}) {
  return [
    'Запрос от дизайнера под проект',
    `ФИО: ${payload.fullName || '—'}`,
    `Телефон: ${payload.phone || '—'}`,
    `Запрос: ${payload.requestText || payload.description || '—'}`,
    `Username: ${payload.username || '—'}`,
    `User ID: ${payload.userId || '—'}`,
    `Дата: ${payload.date || '—'}`,
  ].join('\n');
}

function resolveTelegramClient(source) {
  if (source?.telegram) {
    return source.telegram;
  }

  return source;
}

function extractMigratedChatId(error) {
  return (
    error?.response?.parameters?.migrate_to_chat_id ||
    error?.parameters?.migrate_to_chat_id ||
    null
  );
}

async function sendMessageToChat(telegram, chatId, message) {
  await telegram.sendMessage(chatId, message);

  logger.info('Message sent to work group.', {
    groupChatId: chatId,
  });
}

function updateMigratedChatId(oldChatId, migratedChatId) {
  const normalizedMigratedChatId = String(migratedChatId);

  if (oldChatId === config.groupChatId) {
    config.groupChatId = normalizedMigratedChatId;
  }

  if (oldChatId === config.customerRequestGroupChatId) {
    config.customerRequestGroupChatId = normalizedMigratedChatId;
  }
}

function getMigratedChatIdEnvHint(oldChatId, migratedChatId) {
  const envName = oldChatId === config.customerRequestGroupChatId
    ? 'CUSTOMER_REQUEST_GROUP_CHAT_ID'
    : 'GROUP_CHAT_ID';

  return `Update ${envName}=${migratedChatId} in .env`;
}

async function sendMessageToGroup(source, message, chatId = config.groupChatId) {
  if (!chatId) {
    logger.warn('Telegram group chat id is empty. Group notification skipped.');
    return false;
  }

  const telegram = resolveTelegramClient(source);

  try {
    await sendMessageToChat(telegram, chatId, message);
  } catch (error) {
    const migratedChatId = extractMigratedChatId(error);

    if (!migratedChatId) {
      throw error;
    }

    logger.warn('Telegram group was upgraded to a supergroup. Retrying with migrated chat id.', {
      oldGroupChatId: chatId,
      newGroupChatId: String(migratedChatId),
      envHint: getMigratedChatIdEnvHint(chatId, migratedChatId),
    });

    updateMigratedChatId(chatId, migratedChatId);
    await sendMessageToChat(telegram, String(migratedChatId), message);
  }

  return true;
}

module.exports = {
  buildRequestLeadMessage,
  buildConsultationLeadMessage,
  buildDesignerLeadMessage,
  buildDesignerProjectLeadMessage,
  sendMessageToGroup,
};
