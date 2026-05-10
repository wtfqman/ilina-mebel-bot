const { DESIGNER_FORM_FIELD_LABELS } = require('../constants/designer-form-texts');
const { formatDateTime } = require('../utils/date-time');
const { createFormSessionService } = require('./form-session.service');

const DESIGNER_FORM_SESSION_KEY = 'designerProfileForm';

function createEmptyDesignerForm() {
  return {
    fullName: '',
    contacts: '',
    certification: '',
    isSubmitting: false,
  };
}

const designerFormSession = createFormSessionService(
  DESIGNER_FORM_SESSION_KEY,
  createEmptyDesignerForm,
);

function buildDesignerSummary(formData) {
  return [
    `${DESIGNER_FORM_FIELD_LABELS.FULL_NAME}: ${formData.fullName}`,
    `${DESIGNER_FORM_FIELD_LABELS.CONTACTS}: ${formData.contacts}`,
    `${DESIGNER_FORM_FIELD_LABELS.CERTIFICATION}: ${formData.certification}`,
  ].join('\n');
}

function buildDesignerNotificationPayload(ctx) {
  const formData = designerFormSession.getForm(ctx);

  return {
    fullName: formData.fullName,
    contacts: formData.contacts,
    certification: formData.certification,
    username: ctx.from?.username ? `@${ctx.from.username}` : '—',
    userId: ctx.from?.id ? String(ctx.from.id) : '—',
    date: formatDateTime(new Date()),
  };
}

function buildDesignerSpreadsheetRecord(ctx) {
  const formData = designerFormSession.getForm(ctx);

  return {
    created_at: new Date().toISOString(),
    type: 'designer_registration',
    full_name: formData.fullName,
    contacts: formData.contacts,
    certificate_info: formData.certification,
    telegram_username: ctx.from?.username ? `@${ctx.from.username}` : '',
    telegram_user_id: ctx.from?.id ? String(ctx.from.id) : '',
  };
}

module.exports = {
  ...designerFormSession,
  clearDesignerForm: designerFormSession.clearForm,
  buildDesignerSummary,
  buildDesignerNotificationPayload,
  buildDesignerSpreadsheetRecord,
};
