const { google } = require('googleapis');

const { config } = require('../config/env');
const { logger } = require('../config/logger');

const GOOGLE_SHEETS_SCOPE = ['https://www.googleapis.com/auth/spreadsheets'];

const GOOGLE_SHEETS_REQUIRED_ENV_NAMES = Object.freeze([
  'GOOGLE_SHEETS_SPREADSHEET_ID',
  'GOOGLE_SHEETS_CLIENT_EMAIL',
  'GOOGLE_SHEETS_PRIVATE_KEY',
]);

const SHEET_DEFINITIONS = Object.freeze({
  customerRequest: Object.freeze({
    key: 'customerRequest',
    envName: 'GOOGLE_SHEETS_CUSTOMER_REQUESTS_SHEET',
    getSheetName() {
      return config.googleSheetsCustomerRequestsSheet;
    },
    columns: Object.freeze([
      'created_at',
      'type',
      'name',
      'phone',
      'city',
      'request_text',
      'telegram_username',
      'telegram_user_id',
    ]),
  }),
  consultation: Object.freeze({
    key: 'consultation',
    envName: 'GOOGLE_SHEETS_CONSULTATIONS_SHEET',
    getSheetName() {
      return config.googleSheetsConsultationsSheet;
    },
    columns: Object.freeze([
      'created_at',
      'type',
      'role',
      'name',
      'phone',
      'city',
      'manager',
      'preferred_time',
      'telegram_username',
      'telegram_user_id',
    ]),
  }),
  designerRegistration: Object.freeze({
    key: 'designerRegistration',
    envName: 'GOOGLE_SHEETS_DESIGNERS_SHEET',
    getSheetName() {
      return config.googleSheetsDesignersSheet;
    },
    columns: Object.freeze([
      'created_at',
      'type',
      'full_name',
      'contacts',
      'certificate_info',
      'telegram_username',
      'telegram_user_id',
    ]),
  }),
  designerProjectRequest: Object.freeze({
    key: 'designerProjectRequest',
    envName: 'GOOGLE_SHEETS_DESIGNER_PROJECTS_SHEET',
    getSheetName() {
      return config.googleSheetsDesignerProjectsSheet;
    },
    columns: Object.freeze([
      'created_at',
      'type',
      'full_name',
      'phone',
      'city',
      'project_description',
      'comment',
      'telegram_username',
      'telegram_user_id',
    ]),
  }),
});

let sheetsClientPromise = null;
let startupStatusLogged = false;

function getMissingGoogleSheetsEnvNames() {
  const envMap = {
    GOOGLE_SHEETS_SPREADSHEET_ID: config.googleSheetsSpreadsheetId,
    GOOGLE_SHEETS_CLIENT_EMAIL: config.googleSheetsClientEmail,
    GOOGLE_SHEETS_PRIVATE_KEY: config.googleSheetsPrivateKey,
  };

  return Object.entries(envMap)
    .filter(([, value]) => !value)
    .map(([envName]) => envName);
}

function getMissingSheetNames() {
  return Object.values(SHEET_DEFINITIONS)
    .filter((sheetDefinition) => !sheetDefinition.getSheetName())
    .map((sheetDefinition) => sheetDefinition.envName);
}

function isGoogleSheetsConfigured() {
  return getMissingGoogleSheetsEnvNames().length === 0;
}

function isGoogleSheetsReady() {
  return isGoogleSheetsConfigured() && getMissingSheetNames().length === 0;
}

function logGoogleSheetsStartupStatus() {
  if (startupStatusLogged) {
    return;
  }

  startupStatusLogged = true;

  const missingCoreEnv = getMissingGoogleSheetsEnvNames();

  if (missingCoreEnv.length > 0) {
    logger.warn('Google Sheets integration disabled because env is incomplete.', {
      requiredEnvVars: GOOGLE_SHEETS_REQUIRED_ENV_NAMES,
      missingEnvVars: missingCoreEnv,
    });
    return;
  }

  const missingSheetNames = getMissingSheetNames();

  if (missingSheetNames.length > 0) {
    logger.warn('Google Sheets integration enabled partially. Some sheet names are missing.', {
      missingEnvVars: missingSheetNames,
    });
    return;
  }

  logger.info('Google Sheets integration enabled.', {
    spreadsheetId: config.googleSheetsSpreadsheetId,
    sheets: {
      customerRequests: config.googleSheetsCustomerRequestsSheet,
      consultations: config.googleSheetsConsultationsSheet,
      designers: config.googleSheetsDesignersSheet,
      designerProjects: config.googleSheetsDesignerProjectsSheet,
    },
  });
}

function buildSheetRange(sheetName) {
  const escapedSheetName = String(sheetName).replace(/'/g, "''");
  return `'${escapedSheetName}'!A:Z`;
}

function buildRow(columns, record) {
  return columns.map((column) => record[column] ?? '');
}

async function getSheetsClient() {
  if (!isGoogleSheetsConfigured()) {
    return null;
  }

  if (!sheetsClientPromise) {
    sheetsClientPromise = (async () => {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: config.googleSheetsClientEmail,
          private_key: config.googleSheetsPrivateKey,
        },
        scopes: GOOGLE_SHEETS_SCOPE,
      });

      return google.sheets({
        version: 'v4',
        auth,
      });
    })();
  }

  return sheetsClientPromise;
}

async function appendRecordToSheet(sheetDefinition, record) {
  const sheetName = sheetDefinition.getSheetName();

  if (!sheetName) {
    logger.warn('Google Sheets append skipped because sheet name is empty.', {
      sheetKey: sheetDefinition.key,
      envName: sheetDefinition.envName,
    });
    return false;
  }

  try {
    const sheetsClient = await getSheetsClient();

    if (!sheetsClient) {
      logger.warn('Google Sheets append skipped because integration is disabled.', {
        sheetKey: sheetDefinition.key,
      });
      return false;
    }

    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: config.googleSheetsSpreadsheetId,
      range: buildSheetRange(sheetName),
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [buildRow(sheetDefinition.columns, record)],
      },
    });

    logger.info('Record appended to Google Sheets.', {
      sheetKey: sheetDefinition.key,
      sheetName,
    });

    return true;
  } catch (error) {
    logger.error('Failed to append record to Google Sheets.', {
      sheetKey: sheetDefinition.key,
      sheetName,
      message: error.message,
    });

    return false;
  }
}

async function appendCustomerRequest(record) {
  return appendRecordToSheet(SHEET_DEFINITIONS.customerRequest, record);
}

async function appendConsultation(record) {
  return appendRecordToSheet(SHEET_DEFINITIONS.consultation, record);
}

async function appendDesignerRegistration(record) {
  return appendRecordToSheet(SHEET_DEFINITIONS.designerRegistration, record);
}

async function appendDesignerProjectRequest(record) {
  return appendRecordToSheet(SHEET_DEFINITIONS.designerProjectRequest, record);
}

module.exports = {
  GOOGLE_SHEETS_REQUIRED_ENV_NAMES,
  SHEET_DEFINITIONS,
  getMissingGoogleSheetsEnvNames,
  isGoogleSheetsConfigured,
  isGoogleSheetsReady,
  logGoogleSheetsStartupStatus,
  appendCustomerRequest,
  appendConsultation,
  appendDesignerRegistration,
  appendDesignerProjectRequest,
};
