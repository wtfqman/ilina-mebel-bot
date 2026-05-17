const { REQUEST_FORM_FIELD_LABELS } = require('../constants/request-form-texts');
const { formatDateTime } = require('../utils/date-time');
const { isNonEmptyText, sanitizeTextInput } = require('../utils/validation');
const { createFormSessionService } = require('./form-session.service');

const REQUEST_FORM_SESSION_KEY = 'customerRequestForm';

const NAME_LABELS = Object.freeze(['имя', 'фио', 'name']);
const REQUEST_LABELS = Object.freeze([
  'что нужно подобрать',
  'что нужно',
  'запрос',
  'описание',
  'request',
]);
const ALL_FIELD_LABELS = Object.freeze([
  ...NAME_LABELS,
  ...REQUEST_LABELS,
]);

function createEmptyRequestForm() {
  return {
    name: '',
    phone: '',
    requestText: '',
    isSubmitting: false,
  };
}

const requestFormSession = createFormSessionService(
  REQUEST_FORM_SESSION_KEY,
  createEmptyRequestForm,
);

function normalizeMultilineText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildLabelPattern(labels) {
  return labels.map(escapeRegExp).join('|');
}

function cleanParsedValue(value) {
  return sanitizeTextInput(value)
    .replace(/^[,.;:!?–—-]+/, '')
    .replace(/[,.;:!?–—-]+$/, '')
    .trim();
}

function stripKnownLabels(value) {
  let result = sanitizeTextInput(value);
  const labelPattern = buildLabelPattern(ALL_FIELD_LABELS);
  const leadingLabelPattern = new RegExp(`^(?:${labelPattern})\\s*[:\\-–—]?\\s*`, 'iu');

  while (leadingLabelPattern.test(result)) {
    result = result.replace(leadingLabelPattern, '').trim();
  }

  return cleanParsedValue(result);
}

function splitRequestLines(text) {
  return normalizeMultilineText(text)
    .split('\n')
    .map(stripKnownLabels)
    .filter(isNonEmptyText);
}

function splitSingleLine(line) {
  const words = stripKnownLabels(line).split(/\s+/).filter(Boolean);

  if (words.length < 2) {
    return {
      name: words.join(' '),
      requestText: '',
    };
  }

  return {
    name: words[0],
    requestText: words.slice(1).join(' '),
  };
}

function parseCustomerRequestDetailsMessage(message) {
  const lines = splitRequestLines(message);

  if (lines.length === 0) {
    return {
      isValid: false,
      reason: 'empty',
    };
  }

  const parsedData = lines.length === 1
    ? splitSingleLine(lines[0])
    : {
      name: stripKnownLabels(lines[0]),
      requestText: stripKnownLabels(lines.slice(1).join('\n')),
    };

  if (!isNonEmptyText(parsedData.name) || !isNonEmptyText(parsedData.requestText)) {
    return {
      isValid: false,
      reason: 'incomplete',
    };
  }

  return {
    isValid: true,
    data: parsedData,
  };
}

function buildRequestSummary(formData) {
  return [
    `${REQUEST_FORM_FIELD_LABELS.NAME}: ${formData.name}`,
    `${REQUEST_FORM_FIELD_LABELS.PHONE}: ${formData.phone}`,
    `${REQUEST_FORM_FIELD_LABELS.REQUEST}: ${formData.requestText}`,
  ].join('\n');
}

function buildRequestNotificationPayload(ctx) {
  const formData = requestFormSession.getForm(ctx);

  return {
    name: formData.name,
    phone: formData.phone,
    requestText: formData.requestText,
    username: ctx.from?.username ? `@${ctx.from.username}` : '—',
    userId: ctx.from?.id ? String(ctx.from.id) : '—',
    date: formatDateTime(new Date()),
  };
}

function buildRequestSpreadsheetRecord(ctx) {
  const formData = requestFormSession.getForm(ctx);

  return {
    created_at: new Date().toISOString(),
    type: 'customer_request',
    name: formData.name,
    phone: formData.phone,
    request_text: formData.requestText,
    telegram_username: ctx.from?.username ? `@${ctx.from.username}` : '',
    telegram_user_id: ctx.from?.id ? String(ctx.from.id) : '',
  };
}

module.exports = {
  ...requestFormSession,
  clearRequestForm: requestFormSession.clearForm,
  parseCustomerRequestDetailsMessage,
  buildRequestSummary,
  buildRequestNotificationPayload,
  buildRequestSpreadsheetRecord,
};
