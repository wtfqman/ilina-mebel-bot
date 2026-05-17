const { google } = require('googleapis');

const { config } = require('../config/env');
const { logger } = require('../config/logger');

const GOOGLE_SHEETS_SCOPE = ['https://www.googleapis.com/auth/spreadsheets'];

const GOOGLE_SHEETS_REQUIRED_ENV_NAMES = Object.freeze([
  'GOOGLE_SHEETS_SPREADSHEET_ID',
  'GOOGLE_SHEETS_CLIENT_EMAIL',
  'GOOGLE_SHEETS_PRIVATE_KEY',
]);

const DEFAULT_ROW_COUNT = 1000;
const HEADER_ROW_HEIGHT = 36;
const HEADER_CLEAR_COLUMN_COUNT = 26;
const WHITE = Object.freeze({ red: 1, green: 1, blue: 1 });

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
    headers: Object.freeze([
      'Дата создания',
      'Тип',
      'Имя',
      'Телефон',
      'Город',
      'Запрос',
      'Telegram',
      'Telegram ID',
    ]),
    columnWidths: Object.freeze([170, 150, 180, 160, 140, 360, 170, 150]),
    headerColor: Object.freeze({ red: 0.12, green: 0.31, blue: 0.47 }),
    tabColor: Object.freeze({ red: 0.25, green: 0.56, blue: 0.77 }),
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
    headers: Object.freeze([
      'Дата создания',
      'Тип',
      'Роль',
      'Имя',
      'Телефон',
      'Город',
      'Менеджер',
      'Удобное время',
      'Telegram',
      'Telegram ID',
    ]),
    columnWidths: Object.freeze([170, 140, 150, 180, 160, 140, 190, 280, 170, 150]),
    headerColor: Object.freeze({ red: 0.39, green: 0.28, blue: 0.61 }),
    tabColor: Object.freeze({ red: 0.54, green: 0.43, blue: 0.74 }),
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
    headers: Object.freeze([
      'Дата создания',
      'Тип',
      'ФИО',
      'Контакты',
      'Сертификат / информация',
      'Telegram',
      'Telegram ID',
    ]),
    columnWidths: Object.freeze([170, 180, 220, 260, 340, 170, 150]),
    headerColor: Object.freeze({ red: 0.26, green: 0.44, blue: 0.24 }),
    tabColor: Object.freeze({ red: 0.45, green: 0.68, blue: 0.41 }),
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
    headers: Object.freeze([
      'Дата создания',
      'Тип',
      'ФИО',
      'Телефон',
      'Город',
      'Описание проекта',
      'Комментарий',
      'Telegram',
      'Telegram ID',
    ]),
    columnWidths: Object.freeze([170, 190, 220, 160, 140, 360, 260, 170, 150]),
    headerColor: Object.freeze({ red: 0.64, green: 0.39, blue: 0.12 }),
    tabColor: Object.freeze({ red: 0.87, green: 0.61, blue: 0.26 }),
  }),
});

let sheetsClientPromise = null;
let startupStatusLogged = false;
const preparedSheetCache = new Set();

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

function getColumnName(columnIndex) {
  let name = '';
  let dividend = columnIndex + 1;

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return name;
}

function buildSheetRange(sheetName, range = 'A:Z') {
  const escapedSheetName = String(sheetName).replace(/'/g, "''");
  return `'${escapedSheetName}'!${range}`;
}

function buildHeaderClearRange(sheetName) {
  const lastColumn = getColumnName(HEADER_CLEAR_COLUMN_COUNT - 1);

  return buildSheetRange(sheetName, `A1:${lastColumn}1`);
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

function buildPreparedSheetCacheKey(sheetDefinition, sheetName) {
  return [
    config.googleSheetsSpreadsheetId,
    sheetDefinition.key,
    sheetName,
  ].join(':');
}

function getSheetHeaders(sheetDefinition) {
  return sheetDefinition.headers || sheetDefinition.columns;
}

async function getSpreadsheetSheetProperties(sheetsClient) {
  const response = await sheetsClient.spreadsheets.get({
    spreadsheetId: config.googleSheetsSpreadsheetId,
    fields: 'sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))',
  });

  return (response.data.sheets || []).map((sheet) => sheet.properties);
}

async function createSheet(sheetsClient, sheetDefinition, sheetName) {
  const response = await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: config.googleSheetsSpreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: DEFAULT_ROW_COUNT,
                columnCount: Math.max(sheetDefinition.columns.length, 10),
                frozenRowCount: 1,
              },
              tabColor: sheetDefinition.tabColor,
            },
          },
        },
      ],
    },
  });

  return response.data.replies?.[0]?.addSheet?.properties;
}

async function getOrCreateSheetProperties(sheetsClient, sheetDefinition, sheetName) {
  const sheets = await getSpreadsheetSheetProperties(sheetsClient);
  const existingSheet = sheets.find((sheet) => sheet.title === sheetName);

  if (existingSheet) {
    return existingSheet;
  }

  const createdSheet = await createSheet(sheetsClient, sheetDefinition, sheetName);

  logger.info('Google Sheets tab created.', {
    sheetKey: sheetDefinition.key,
    sheetName,
  });

  return createdSheet;
}

function buildHeaderValues(sheetDefinition) {
  const headers = getSheetHeaders(sheetDefinition);
  const emptyTailLength = Math.max(HEADER_CLEAR_COLUMN_COUNT - headers.length, 0);

  return [
    ...headers,
    ...Array(emptyTailLength).fill(''),
  ];
}

async function writeHeaderRow(sheetsClient, sheetDefinition, sheetName) {
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: config.googleSheetsSpreadsheetId,
    range: buildHeaderClearRange(sheetName),
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [buildHeaderValues(sheetDefinition)],
    },
  });
}

function buildColumnWidthRequests(sheetDefinition, sheetId) {
  return sheetDefinition.columns.map((column, columnIndex) => ({
    updateDimensionProperties: {
      range: {
        sheetId,
        dimension: 'COLUMNS',
        startIndex: columnIndex,
        endIndex: columnIndex + 1,
      },
      properties: {
        pixelSize: sheetDefinition.columnWidths?.[columnIndex] || 160,
      },
      fields: 'pixelSize',
    },
  }));
}

function buildFormatRequests(sheetDefinition, sheetProperties) {
  const sheetId = sheetProperties.sheetId;
  const columnCount = sheetDefinition.columns.length;
  const currentRowCount = sheetProperties.gridProperties?.rowCount || 0;
  const currentColumnCount = sheetProperties.gridProperties?.columnCount || 0;
  const targetRowCount = Math.max(currentRowCount, DEFAULT_ROW_COUNT);
  const targetColumnCount = Math.max(currentColumnCount, columnCount);

  return [
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: targetRowCount,
            columnCount: targetColumnCount,
          },
          tabColor: sheetDefinition.tabColor,
        },
        fields: 'gridProperties.frozenRowCount,gridProperties.rowCount,gridProperties.columnCount,tabColor',
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: 0,
          endIndex: 1,
        },
        properties: {
          pixelSize: HEADER_ROW_HEIGHT,
        },
        fields: 'pixelSize',
      },
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: columnCount,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: sheetDefinition.headerColor,
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
            textFormat: {
              bold: true,
              foregroundColor: WHITE,
            },
          },
        },
        fields: [
          'userEnteredFormat.backgroundColor',
          'userEnteredFormat.horizontalAlignment',
          'userEnteredFormat.verticalAlignment',
          'userEnteredFormat.wrapStrategy',
          'userEnteredFormat.textFormat',
        ].join(','),
      },
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: targetRowCount,
          startColumnIndex: 0,
          endColumnIndex: columnCount,
        },
        cell: {
          userEnteredFormat: {
            verticalAlignment: 'TOP',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat.verticalAlignment,userEnteredFormat.wrapStrategy',
      },
    },
    {
      setBasicFilter: {
        filter: {
          range: {
            sheetId,
            startRowIndex: 0,
            startColumnIndex: 0,
            endColumnIndex: columnCount,
          },
        },
      },
    },
    ...buildColumnWidthRequests(sheetDefinition, sheetId),
  ];
}

async function formatSheet(sheetsClient, sheetDefinition, sheetProperties) {
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: config.googleSheetsSpreadsheetId,
    requestBody: {
      requests: buildFormatRequests(sheetDefinition, sheetProperties),
    },
  });
}

async function ensureSheetPrepared(sheetsClient, sheetDefinition) {
  const sheetName = sheetDefinition.getSheetName();
  const cacheKey = buildPreparedSheetCacheKey(sheetDefinition, sheetName);

  if (preparedSheetCache.has(cacheKey)) {
    return true;
  }

  const sheetProperties = await getOrCreateSheetProperties(sheetsClient, sheetDefinition, sheetName);

  await writeHeaderRow(sheetsClient, sheetDefinition, sheetName);

  try {
    await formatSheet(sheetsClient, sheetDefinition, sheetProperties);
  } catch (error) {
    logger.warn('Google Sheets formatting failed; appending will still be attempted.', {
      sheetKey: sheetDefinition.key,
      sheetName,
      message: error.message,
    });
  }

  preparedSheetCache.add(cacheKey);

  return true;
}

async function ensureGoogleSheetsStructure() {
  if (!isGoogleSheetsConfigured()) {
    logger.warn('Google Sheets structure setup skipped because env is incomplete.', {
      missingEnvVars: getMissingGoogleSheetsEnvNames(),
    });
    return false;
  }

  let sheetsClient;

  try {
    sheetsClient = await getSheetsClient();
  } catch (error) {
    logger.error('Google Sheets client initialization failed.', {
      message: error.message,
    });
    return false;
  }

  if (!sheetsClient) {
    return false;
  }

  let preparedCount = 0;

  for (const sheetDefinition of Object.values(SHEET_DEFINITIONS)) {
    const sheetName = sheetDefinition.getSheetName();

    if (!sheetName) {
      logger.warn('Google Sheets tab setup skipped because sheet name is empty.', {
        sheetKey: sheetDefinition.key,
        envName: sheetDefinition.envName,
      });
      continue;
    }

    try {
      await ensureSheetPrepared(sheetsClient, sheetDefinition);
      preparedCount += 1;
    } catch (error) {
      logger.error('Failed to prepare Google Sheets tab.', {
        sheetKey: sheetDefinition.key,
        sheetName,
        message: error.message,
      });
    }
  }

  logger.info('Google Sheets structure check finished.', {
    preparedSheets: preparedCount,
  });

  return preparedCount > 0;
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

    await ensureSheetPrepared(sheetsClient, sheetDefinition);

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
  ensureGoogleSheetsStructure,
  appendCustomerRequest,
  appendConsultation,
  appendDesignerRegistration,
  appendDesignerProjectRequest,
};
