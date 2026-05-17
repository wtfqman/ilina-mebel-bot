const dotenv = require('dotenv');

dotenv.config();

function normalizeMultilineEnvValue(value = '') {
  return value.replace(/\\n/g, '\n');
}

function stripWrappingQuotes(value = '') {
  return String(value)
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
}

function normalizeTelegramUserId(userId) {
  const normalizedUserId = stripWrappingQuotes(userId);

  if (!/^\d+$/.test(normalizedUserId)) {
    return null;
  }

  const numericUserId = Number(normalizedUserId);

  return Number.isSafeInteger(numericUserId) ? numericUserId : null;
}

function parseAdminIdsEnvValue(value = '') {
  const adminIds = String(value)
    .split(',')
    .map(stripWrappingQuotes)
    .map(normalizeTelegramUserId)
    .filter((adminId) => adminId !== null);

  return [...new Set(adminIds)];
}

const config = {
  botToken: process.env.BOT_TOKEN || '',
  groupChatId: process.env.GROUP_CHAT_ID || '',
  customerRequestGroupChatId: process.env.CUSTOMER_REQUEST_GROUP_CHAT_ID || '-5124199963',
  botName: process.env.BOT_NAME || 'Furniture Company Bot',
  nodeEnv: process.env.NODE_ENV || 'development',
  adminIds: parseAdminIdsEnvValue(process.env.ADMIN_IDS || ''),
  priceTelegramFileId: process.env.PRICE_TELEGRAM_FILE_ID || '',
  googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  googleSheetsClientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '',
  googleSheetsPrivateKey: normalizeMultilineEnvValue(process.env.GOOGLE_SHEETS_PRIVATE_KEY || ''),
  googleSheetsCustomerRequestsSheet:
    process.env.GOOGLE_SHEETS_CUSTOMER_REQUESTS_SHEET ||
    process.env.GOOGLE_SHEETS_APPLICATION_SHEET ||
    '',
  googleSheetsConsultationsSheet:
    process.env.GOOGLE_SHEETS_CONSULTATIONS_SHEET ||
    process.env.GOOGLE_SHEETS_CONSULTATION_SHEET ||
    '',
  googleSheetsDesignersSheet: process.env.GOOGLE_SHEETS_DESIGNERS_SHEET || '',
  googleSheetsDesignerProjectsSheet: process.env.GOOGLE_SHEETS_DESIGNER_PROJECTS_SHEET || '',
};

function validateEnv() {
  const requiredEnvVars = ['BOT_TOKEN'];
  const missingEnvVars = requiredEnvVars.filter((envName) => !process.env[envName]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}. Update your .env file before starting the bot.`,
    );
  }
}

function getConfigWarnings() {
  const warnings = [];

  if (!config.groupChatId) {
    warnings.push({
      code: 'missing-group-chat-id',
      message: 'GROUP_CHAT_ID is empty. Lead forms without a dedicated Telegram group id will not be able to send data to the work group.',
    });
  }

  return warnings;
}

module.exports = {
  config,
  validateEnv,
  getConfigWarnings,
  normalizeTelegramUserId,
  parseAdminIdsEnvValue,
};
