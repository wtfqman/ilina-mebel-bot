const {
  DESIGNER_PROJECT_FORM_FIELD_LABELS,
} = require('../constants/designer-project-form-texts');
const { formatDateTime } = require('../utils/date-time');
const {
  isNonEmptyText,
  isValidPhoneNumber,
  normalizePhoneNumber,
  sanitizeTextInput,
} = require('../utils/validation');
const { createFormSessionService } = require('./form-session.service');

const DESIGNER_PROJECT_FORM_SESSION_KEY = 'designerProjectForm';
const PHONE_CANDIDATE_PATTERN = /\+?\d[\d\s().-]{8,}\d/g;

const FULL_NAME_LABELS = Object.freeze(['фио', 'имя', 'full name', 'name']);
const PHONE_LABELS = Object.freeze(['номер телефона', 'телефон', 'phone']);
const REQUEST_LABELS = Object.freeze([
  'описание запроса',
  'описание проекта',
  'что нужно',
  'запрос',
  'проект',
  'описание',
  'request',
]);
const ALL_FIELD_LABELS = Object.freeze([
  ...FULL_NAME_LABELS,
  ...PHONE_LABELS,
  ...REQUEST_LABELS,
]);
const REQUEST_KEYWORDS = Object.freeze([
  '3d',
  '3д',
  'визуал',
  'гардероб',
  'диван',
  'дизайн',
  'квартир',
  'кух',
  'модел',
  'нуж',
  'панел',
  'подбор',
  'подобр',
  'проект',
  'стен',
  'техник',
  'хочу',
  'шкаф',
]);

function createEmptyDesignerProjectForm() {
  return {
    fullName: '',
    phone: '',
    description: '',
    city: '',
    comment: '',
    isSubmitting: false,
  };
}

const designerProjectFormSession = createFormSessionService(
  DESIGNER_PROJECT_FORM_SESSION_KEY,
  createEmptyDesignerProjectForm,
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

function looksLikeFullName(value) {
  const normalizedValue = stripKnownLabels(value);
  const words = normalizedValue.split(/\s+/).filter(Boolean);
  const namePattern = /^[A-Za-zА-Яа-яЁёІіЇїЄє' -]+$/u;

  return (
    words.length > 0 &&
    words.length <= 5 &&
    normalizedValue.length <= 80 &&
    namePattern.test(normalizedValue) &&
    !containsRequestKeyword(normalizedValue)
  );
}

function findFullNameLineIndex(lines) {
  const candidates = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => looksLikeFullName(line));

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
      fullName: stripKnownLabels(line),
      description: '',
    };
  }

  const requestStartIndex = words.findIndex((word, index) => (
    index > 0 && containsRequestKeyword(word)
  ));
  const splitIndex = requestStartIndex > 0 ? requestStartIndex : Math.min(2, words.length - 1);

  return {
    fullName: stripKnownLabels(words.slice(0, splitIndex).join(' ')),
    description: stripKnownLabels(words.slice(splitIndex).join(' ')),
  };
}

function parseLineBasedFields(text) {
  const lines = splitRequestLines(text);

  if (lines.length === 0) {
    return {
      fullName: '',
      description: '',
    };
  }

  if (lines.length === 1) {
    return splitSingleLine(lines[0]);
  }

  const fullNameLineIndex = findFullNameLineIndex(lines);
  const resolvedFullNameLineIndex = fullNameLineIndex >= 0 ? fullNameLineIndex : 0;
  const descriptionLines = lines.filter((line, index) => index !== resolvedFullNameLineIndex);

  return {
    fullName: stripKnownLabels(lines[resolvedFullNameLineIndex]),
    description: stripKnownLabels(descriptionLines.join('\n')),
  };
}

function parseDesignerProjectMessage(message) {
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
  const fullName = cleanParsedValue(
    extractLabeledValue(messageWithoutPhone, FULL_NAME_LABELS, [
      ...PHONE_LABELS,
      ...REQUEST_LABELS,
    ]) || fallbackFields.fullName,
  );
  const description = cleanParsedValue(
    extractLabeledValue(messageWithoutPhone, REQUEST_LABELS, [
      ...FULL_NAME_LABELS,
      ...PHONE_LABELS,
    ]) || fallbackFields.description,
  );

  if (!isNonEmptyText(fullName) || !isNonEmptyText(description)) {
    return {
      isValid: false,
      reason: 'incomplete',
    };
  }

  return {
    isValid: true,
    data: {
      fullName,
      phone: phoneMatch.phone,
      description,
    },
  };
}

function buildDesignerProjectSummary(formData) {
  return [
    `${DESIGNER_PROJECT_FORM_FIELD_LABELS.FULL_NAME}: ${formData.fullName}`,
    `${DESIGNER_PROJECT_FORM_FIELD_LABELS.PHONE}: ${formData.phone}`,
    `${DESIGNER_PROJECT_FORM_FIELD_LABELS.REQUEST}: ${formData.description}`,
  ].join('\n');
}

function buildDesignerProjectNotificationPayload(ctx) {
  const formData = designerProjectFormSession.getForm(ctx);

  return {
    fullName: formData.fullName,
    phone: formData.phone,
    requestText: formData.description,
    description: formData.description,
    username: ctx.from?.username ? `@${ctx.from.username}` : '—',
    userId: ctx.from?.id ? String(ctx.from.id) : '—',
    date: formatDateTime(new Date()),
  };
}

function buildDesignerProjectSpreadsheetRecord(ctx) {
  const formData = designerProjectFormSession.getForm(ctx);

  return {
    created_at: new Date().toISOString(),
    type: 'designer_project_request',
    full_name: formData.fullName,
    phone: formData.phone,
    city: '',
    project_description: formData.description,
    comment: '',
    telegram_username: ctx.from?.username ? `@${ctx.from.username}` : '',
    telegram_user_id: ctx.from?.id ? String(ctx.from.id) : '',
  };
}

module.exports = {
  ...designerProjectFormSession,
  clearDesignerProjectForm: designerProjectFormSession.clearForm,
  parseDesignerProjectMessage,
  buildDesignerProjectSummary,
  buildDesignerProjectNotificationPayload,
  buildDesignerProjectSpreadsheetRecord,
};
