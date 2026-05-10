const {
  DESIGNER_FORM_FIELD_LABELS,
  DESIGNER_FORM_TEXTS,
} = require('../constants/designer-form-texts');
const { SCENE_IDS } = require('../constants/scenes');
const { appendDesignerSubmission } = require('../services/google-sheets.service');
const { buildDesignerLeadMessage } = require('../services/group-notification.service');
const {
  buildDesignerNotificationPayload,
  buildDesignerSpreadsheetRecord,
  buildDesignerSummary,
  getForm,
  initializeForm,
  updateFormField,
  clearForm,
  isSubmissionInProgress,
  setSubmissionInProgress,
} = require('../services/designer-form.service');
const { createLeadFormScene } = require('./helpers/create-lead-form.scene');

const designerFormScene = createLeadFormScene({
  sceneId: SCENE_IDS.DESIGNER_PROFILE,
  sceneName: 'Designer profile form',
  texts: DESIGNER_FORM_TEXTS,
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
      field: 'fullName',
      label: DESIGNER_FORM_FIELD_LABELS.FULL_NAME,
      prompt: DESIGNER_FORM_TEXTS.askFullName,
      type: 'text',
    },
    {
      field: 'contacts',
      label: DESIGNER_FORM_FIELD_LABELS.CONTACTS,
      prompt: DESIGNER_FORM_TEXTS.askContacts,
      type: 'text',
    },
    {
      field: 'certification',
      label: DESIGNER_FORM_FIELD_LABELS.CERTIFICATION,
      prompt: DESIGNER_FORM_TEXTS.askCertification,
      type: 'text',
    },
  ],
  buildSummary(ctx) {
    return buildDesignerSummary(getForm(ctx));
  },
  buildNotificationPayload: buildDesignerNotificationPayload,
  buildSpreadsheetRecord: buildDesignerSpreadsheetRecord,
  buildGroupMessage: buildDesignerLeadMessage,
  appendToSheet: appendDesignerSubmission,
  leadType: 'designer profile form',
});

module.exports = {
  designerFormScene,
};
