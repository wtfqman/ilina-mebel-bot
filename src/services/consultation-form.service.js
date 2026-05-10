const { FIRST_AVAILABLE_MANAGER_OPTION, MANAGERS } = require('../config/managers');
const { CONSULTATION_FORM_FIELD_LABELS } = require('../constants/consultation-form-texts');
const { USER_ROLE_LABELS } = require('../constants/user-roles');
const { formatDateTime } = require('../utils/date-time');
const { createFormSessionService } = require('./form-session.service');
const { getUserRole } = require('./user-role.service');

const CONSULTATION_FORM_SESSION_KEY = 'consultationForm';
const AVAILABLE_MANAGER_NAMES = Object.freeze([
  FIRST_AVAILABLE_MANAGER_OPTION.name,
  ...MANAGERS.map((manager) => manager.name),
]);

function createEmptyConsultationForm() {
  return {
    name: '',
    phone: '',
    city: '',
    manager: '',
    convenientTime: '',
    isSubmitting: false,
  };
}

const consultationFormSession = createFormSessionService(
  CONSULTATION_FORM_SESSION_KEY,
  createEmptyConsultationForm,
);

function isValidManagerChoice(value) {
  return AVAILABLE_MANAGER_NAMES.includes(value);
}

function buildConsultationSummary(formData, role) {
  return [
    `Роль: ${USER_ROLE_LABELS[role] || '—'}`,
    `${CONSULTATION_FORM_FIELD_LABELS.NAME}: ${formData.name}`,
    `${CONSULTATION_FORM_FIELD_LABELS.PHONE}: ${formData.phone}`,
    `${CONSULTATION_FORM_FIELD_LABELS.CITY}: ${formData.city}`,
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
    city: formData.city,
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
    city: formData.city,
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
  buildConsultationSummary,
  buildConsultationNotificationPayload,
  buildConsultationSpreadsheetRecord,
};
