const { REQUEST_FORM_FIELD_LABELS } = require('../constants/request-form-texts');
const { formatDateTime } = require('../utils/date-time');
const {
  isNonEmptyText,
  isValidPhoneNumber,
  normalizePhoneNumber,
  sanitizeTextInput,
} = require('../utils/validation');
const { createFormSessionService } = require('./form-session.service');

const REQUEST_FORM_SESSION_KEY = 'customerRequestForm';
const PHONE_CANDIDATE_PATTERN = /\+?\d[\d\s().-]{8,}\d/g;

const NAME_LABELS = Object.freeze(['имя', 'фио', 'name']);
const PHONE_LABELS = Object.freeze(['номер телефона', 'телефон', 'phone']);
const REQUEST_LABELS = Object.freeze([
  'что нужно подобрать',
  'что нужно',
  'запрос',
  'описание',
  'request',
]);
const ALL_FIELD_LABELS = Object.freeze([
  ...NAME_LABELS,
  ...PHONE_LABELS,
  ...REQUEST_LABELS,
]);
const REQUEST_KEYWORDS = Object.freeze([
  'бытов',
  'гардероб',
  'диван',
  'интерес',
  'кух',
  'кровать',
  'мебел',
  'нуж',
  'панел',
  'подобр',
  'проект',
  'рассчит',
  'стен',
  'стол',
  'стул',
  'техник',
  'хочу',
  'шкаф',
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
  const trailingLabelPattern = new RegExp(`\\s*(?:${labelPattern})\\s*[:\\-–—]?\\s*$`, 'iu');

  while (leadingLabelPattern.test(result) || trailingLabelPattern.test(result)) {
    result = result
      .replace(leadingLabelPattern, '')
      .replace(trailingLabelPattern, '')
      .trim();
  }

  return cleanParsedValue(result);
}

function extractPhoneMatch(message) {
  const matches = message.matchAll(PHONE_CANDIDATE_PATTERN);

  for (const match of matches) {
    const phone = normalizePhoneNumber(match[0]);

    if (isValidPhoneNumber(phone)) {
      return {
        phone,
        raw: match[0],
        index: match.index,
      };
    }
  }

  return null;
}

function removePhoneFromMessage(message, phoneMatch) {
  return [
    message.slice(0, phoneMatch.index),
    message.slice(phoneMatch.index + phoneMatch.raw.length),
  ].join('\n');
}

function extractLabeledValue(text, labels, stopLabels) {
  const labelPattern = buildLabelPattern(labels);
  const stopPattern = buildLabelPattern(stopLabels);
  const fieldPattern = new RegExp(
    `(?:^|[\\n;])\\s*(?:${labelPattern})\\s*[:\\-–—]?\\s*([\\s\\S]*?)(?=(?:\\n|;|\\s)+(?:${stopPattern})\\s*[:\\-–—]?|$)`,
    'iu',
  );
  const match = text.match(fieldPattern);

  if (!match) {
    return '';
  }

  return stripKnownLabels(match[1]);
}

function splitRequestLines(text) {
  return normalizeMultilineText(text)
    .split('\n')
    .map(stripKnownLabels)
    .filter(isNonEmptyText);
}

function containsRequestKeyword(value) {
  const lowerValue = value.toLowerCase();
  return REQUEST_KEYWORDS.some((keyword) => lowerValue.includes(keyword));
}

function looksLikeName(value) {
  const normalizedValue = stripKnownLabels(value);
  const words = normalizedValue.split(/\s+/).filter(Boolean);
  const namePattern = /^[A-Za-zА-Яа-яЁёІіЇїЄє' -]+$/u;

  return (
    words.length > 0 &&
    words.length <= 4 &&
    normalizedValue.length <= 60 &&
    namePattern.test(normalizedValue) &&
    !containsRequestKeyword(normalizedValue)
  );
}

function findNameLineIndex(lines) {
  const candidates = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => looksLikeName(line));

  if (candidates.length === 0) {
    return -1;
  }

  candidates.sort((left, right) => {
    const leftWordCount = left.line.split(/\s+/).length;
    const rightWordCount = right.line.split(/\s+/).length;

    return leftWordCount - rightWordCount || left.line.length - right.line.length;
  });

  return candidates[0].index;
}

function splitSingleLine(line) {
  const words = line.split(/\s+/).filter(Boolean);

  if (words.length < 2) {
    return {
      name: stripKnownLabels(line),
      requestText: '',
    };
  }

  const requestStartIndex = words.findIndex((word, index) => (
    index > 0 && containsRequestKeyword(word)
  ));
  const splitIndex = requestStartIndex > 0 ? requestStartIndex : 1;

  return {
    name: stripKnownLabels(words.slice(0, splitIndex).join(' ')),
    requestText: stripKnownLabels(words.slice(splitIndex).join(' ')),
  };
}

function parseLineBasedFields(text) {
  const lines = splitRequestLines(text);

  if (lines.length === 0) {
    return {
      name: '',
      requestText: '',
    };
  }

  if (lines.length === 1) {
    return splitSingleLine(lines[0]);
  }

  const nameLineIndex = findNameLineIndex(lines);
  const resolvedNameLineIndex = nameLineIndex >= 0 ? nameLineIndex : 0;
  const requestLines = lines.filter((line, index) => index !== resolvedNameLineIndex);

  return {
    name: stripKnownLabels(lines[resolvedNameLineIndex]),
    requestText: stripKnownLabels(requestLines.join('\n')),
  };
}

function parseCustomerRequestMessage(message) {
  const normalizedMessage = normalizeMultilineText(message);

  if (!normalizedMessage) {
    return {
      isValid: false,
      reason: 'empty',
    };
  }

  const phoneMatch = extractPhoneMatch(normalizedMessage);

  if (!phoneMatch) {
    return {
      isValid: false,
      reason: 'phone',
    };
  }

  const messageWithoutPhone = removePhoneFromMessage(normalizedMessage, phoneMatch);
  const fallbackFields = parseLineBasedFields(messageWithoutPhone);
  const name = cleanParsedValue(
    extractLabeledValue(messageWithoutPhone, NAME_LABELS, [
      ...PHONE_LABELS,
      ...REQUEST_LABELS,
    ]) || fallbackFields.name,
  );
  const requestText = cleanParsedValue(
    extractLabeledValue(messageWithoutPhone, REQUEST_LABELS, [
      ...NAME_LABELS,
      ...PHONE_LABELS,
    ]) || fallbackFields.requestText,
  );

  if (!isNonEmptyText(name) || !isNonEmptyText(requestText)) {
    return {
      isValid: false,
      reason: 'incomplete',
    };
  }

  return {
    isValid: true,
    data: {
      name,
      phone: phoneMatch.phone,
      requestText,
    },
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
    city: '',
    request_text: formData.requestText,
    telegram_username: ctx.from?.username ? `@${ctx.from.username}` : '',
    telegram_user_id: ctx.from?.id ? String(ctx.from.id) : '',
  };
}

module.exports = {
  ...requestFormSession,
  clearRequestForm: requestFormSession.clearForm,
  parseCustomerRequestMessage,
  buildRequestSummary,
  buildRequestNotificationPayload,
  buildRequestSpreadsheetRecord,
};
