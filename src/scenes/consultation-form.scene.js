const {
  CONSULTATION_FORM_FIELD_LABELS,
  CONSULTATION_FORM_TEXTS,
} = require('../constants/consultation-form-texts');
const { SCENE_IDS } = require('../constants/scenes');
const { consultationManagerKeyboard } = require('../keyboards/consultation-manager.keyboard');
const { appendConsultationSubmission } = require('../services/google-sheets.service');
const { buildConsultationLeadMessage } = require('../services/group-notification.service');
const {
  buildConsultationNotificationPayload,
  buildConsultationSpreadsheetRecord,
  buildConsultationSummary,
  getForm,
  initializeForm,
  updateFormField,
  clearForm,
  isSubmissionInProgress,
  isValidManagerChoice,
  setSubmissionInProgress,
} = require('../services/consultation-form.service');
const { getUserRole } = require('../services/user-role.service');
const { createLeadFormScene } = require('./helpers/create-lead-form.scene');

const consultationFormScene = createLeadFormScene({
  sceneId: SCENE_IDS.CONSULTATION,
  sceneName: 'Consultation form',
  texts: CONSULTATION_FORM_TEXTS,
  state: {
    getForm,
    initializeForm,
    updateFormField,
    clearForm,
    isSubmissionInProgress,
    setSubmissionInProgress,
  },
  steps: [
    {
      field: 'name',
      label: CONSULTATION_FORM_FIELD_LABELS.NAME,
      prompt: CONSULTATION_FORM_TEXTS.askName,
      type: 'text',
    },
    {
      field: 'phone',
      label: CONSULTATION_FORM_FIELD_LABELS.PHONE,
      prompt: CONSULTATION_FORM_TEXTS.askPhone,
      type: 'phone',
    },
    {
      field: 'city',
      label: CONSULTATION_FORM_FIELD_LABELS.CITY,
      prompt: CONSULTATION_FORM_TEXTS.askCity,
      type: 'text',
    },
    {
      field: 'manager',
      label: CONSULTATION_FORM_FIELD_LABELS.MANAGER,
      prompt: CONSULTATION_FORM_TEXTS.askManager,
      type: 'choice',
      keyboard: consultationManagerKeyboard,
      isValidChoice: isValidManagerChoice,
      invalidChoiceText: CONSULTATION_FORM_TEXTS.managerChoiceOnly,
    },
    {
      field: 'convenientTime',
      label: CONSULTATION_FORM_FIELD_LABELS.CONVENIENT_TIME,
      prompt: CONSULTATION_FORM_TEXTS.askConvenientTime,
      type: 'text',
    },
  ],
  buildSummary(ctx) {
    return buildConsultationSummary(getForm(ctx), getUserRole(ctx));
  },
  buildNotificationPayload: buildConsultationNotificationPayload,
  buildSpreadsheetRecord: buildConsultationSpreadsheetRecord,
  buildGroupMessage: buildConsultationLeadMessage,
  appendToSheet: appendConsultationSubmission,
  leadType: 'consultation form',
});

module.exports = {
  consultationFormScene,
};
