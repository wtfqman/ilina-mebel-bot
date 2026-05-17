const { FIRST_AVAILABLE_MANAGER_OPTION, MANAGERS } = require('../config/managers');
const { CONSULTATION_FORM_FIELD_LABELS } = require('../constants/consultation-form-texts');
const { USER_ROLE_LABELS } = require('../constants/user-roles');
const { formatDateTime } = require('../utils/date-time');
const { isNonEmptyText, sanitizeTextInput } = require('../utils/validation');
const { createFormSessionService } = require('./form-session.service');
const { getUserRole } = require('./user-role.service');

const CONSULTATION_FORM_SESSION_KEY = 'consultationForm';
const AVAILABLE_MANAGER_NAMES = Object.freeze([
  FIRST_AVAILABLE_MANAGER_OPTION.name,
  ...MANAGERS.map((manager) => manager.name),
]);

const DETAIL_LABELS = Object.freeze([
  'имя',
  'фио',
  'name',
  'менеджер',
  'manager',
  'время',
  'удобное время',
  'когда',
  'time',
]);

function createEmptyConsultationForm() {
  return {
    name: '',
    phone: '',
    manager: '',
    convenientTime: '',
    isSubmitting: false,
  };
}

const consultationFormSession = createFormSessionService(
  CONSULTATION_FORM_SESSION_KEY,
  createEmptyConsultationForm,
);

function normalizeComparableValue(value) {
  return sanitizeTextInput(value).toLowerCase();
}

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

function stripKnownLabels(value) {
  let result = sanitizeTextInput(value);
  const labelPattern = buildLabelPattern(DETAIL_LABELS);
  const leadingLabelPattern = new RegExp(`^(?:${labelPattern})\\s*[:\\-–—]?\\s*`, 'iu');

  while (leadingLabelPattern.test(result)) {
    result = result.replace(leadingLabelPattern, '').trim();
  }

  return result
    .replace(/^[,.;:!?–—-]+/, '')
    .replace(/[,.;:!?–—-]+$/, '')
    .trim();
}

function splitDetailLines(text) {
  return normalizeMultilineText(text)
    .split('\n')
    .map(stripKnownLabels)
    .filter(isNonEmptyText);
}

function resolveFirstAvailableManager(value) {
  const normalizedValue = normalizeComparableValue(value);
  const firstAvailableName = FIRST_AVAILABLE_MANAGER_OPTION.name;
  const normalizedFirstAvailableName = normalizeComparableValue(firstAvailableName);

  if (normalizedValue === normalizedFirstAvailableName || normalizedValue === 'первый') {
    return firstAvailableName;
  }

  return '';
}

function getManagerNameParts(managerName) {
  return normalizeComparableValue(managerName)
    .split(/\s+/)
    .filter(Boolean);
}

function resolveConfiguredManager(value) {
  const normalizedValue = normalizeComparableValue(value);

  if (!normalizedValue) {
    return '';
  }

  const exactMatch = MANAGERS.find((manager) => (
    normalizeComparableValue(manager.name) === normalizedValue
  ));

  if (exactMatch) {
    return exactMatch.name;
  }

  const partialMatches = MANAGERS.filter((manager) => {
    const normalizedName = normalizeComparableValue(manager.name);
    const nameParts = getManagerNameParts(manager.name);

    return normalizedName.includes(normalizedValue) || nameParts.includes(normalizedValue);
  });

  return partialMatches.length === 1 ? partialMatches[0].name : '';
}

function resolveManagerChoice(value) {
  return resolveFirstAvailableManager(value) || resolveConfiguredManager(value);
}

function isValidManagerChoice(value) {
  return Boolean(resolveManagerChoice(value));
}

function formatAvailableManagersText() {
  return AVAILABLE_MANAGER_NAMES.join('\n');
}

function parseConsultationDetailsMessage(message) {
  const lines = splitDetailLines(message);

  if (lines.length < 3) {
    return {
      isValid: false,
      reason: 'incomplete',
    };
  }

  const name = lines[0];
  const manager = resolveManagerChoice(lines[1]);
  const convenientTime = lines.slice(2).join('\n');

  if (!manager) {
    return {
      isValid: false,
      reason: 'manager',
    };
  }

  if (!isNonEmptyText(name) || !isNonEmptyText(convenientTime)) {
    return {
      isValid: false,
      reason: 'incomplete',
    };
  }

  return {
    isValid: true,
    data: {
      name,
      manager,
      convenientTime,
    },
  };
}

function buildConsultationSummary(formData) {
  return [
    `${CONSULTATION_FORM_FIELD_LABELS.NAME}: ${formData.name}`,
    `${CONSULTATION_FORM_FIELD_LABELS.PHONE}: ${formData.phone}`,
    `${CONSULTATION_FORM_FIELD_LABELS.MANAGER}: ${formData.manager}`,
    `${CONSULTATION_FORM_FIELD_LABELS.CONVENIENT_TIME}: ${formData.convenientTime}`,
  ].join('\n');
}

function buildConsultationNotificationPayload(ctx) {
  const formData = consultationFormSession.getForm(ctx);
  const role = getUserRole(ctx);

  return {
    role: USER_ROLE_LABELS[role] || '—',
    name: formData.name,
    phone: formData.phone,
    manager: formData.manager,
    convenientTime: formData.convenientTime,
    username: ctx.from?.username ? `@${ctx.from.username}` : '—',
    userId: ctx.from?.id ? String(ctx.from.id) : '—',
    date: formatDateTime(new Date()),
  };
}

function buildConsultationSpreadsheetRecord(ctx) {
  const formData = consultationFormSession.getForm(ctx);
  const role = getUserRole(ctx);

  return {
    created_at: new Date().toISOString(),
    type: 'consultation',
    role: USER_ROLE_LABELS[role] || '',
    name: formData.name,
    phone: formData.phone,
    manager: formData.manager,
    preferred_time: formData.convenientTime,
    telegram_username: ctx.from?.username ? `@${ctx.from.username}` : '',
    telegram_user_id: ctx.from?.id ? String(ctx.from.id) : '',
  };
}

module.exports = {
  ...consultationFormSession,
  clearConsultationForm: consultationFormSession.clearForm,
  isValidManagerChoice,
  resolveManagerChoice,
  formatAvailableManagersText,
  parseConsultationDetailsMessage,
  buildConsultationSummary,
  buildConsultationNotificationPayload,
  buildConsultationSpreadsheetRecord,
};
