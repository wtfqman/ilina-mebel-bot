const { Scenes } = require('telegraf');

const { config } = require('../config/env');
const { logger } = require('../config/logger');
const { BOT_TEXTS } = require('../constants/bot-texts');
const { FORM_BUTTONS } = require('../constants/buttons');
const { DESIGNER_PROJECT_FORM_TEXTS } = require('../constants/designer-project-form-texts');
const { PERSONAL_DATA_TEXTS } = require('../constants/personal-data-texts');
const { SCENE_IDS } = require('../constants/scenes');
const { formCancelKeyboard } = require('../keyboards/form-cancel.keyboard');
const { formConsentKeyboard } = require('../keyboards/form-consent.keyboard');
const { formConfirmKeyboard } = require('../keyboards/form-confirm.keyboard');
const { appendDesignerProjectSubmission } = require('../services/google-sheets.service');
const { buildDesignerProjectLeadMessage } = require('../services/group-notification.service');
const { deliverLead } = require('../services/lead-delivery.service');
const { replyWithMainMenu, replyWithStart } = require('../services/navigation.service');
const {
  buildDesignerProjectNotificationPayload,
  buildDesignerProjectSpreadsheetRecord,
  buildDesignerProjectSummary,
  clearForm,
  getForm,
  initializeForm,
  isSubmissionInProgress,
  parseDesignerProjectMessage,
  setSubmissionInProgress,
  updateFormField,
} = require('../services/designer-project-form.service');
const { sanitizeTextInput } = require('../utils/validation');

function getTextMessage(ctx) {
  return sanitizeTextInput(ctx.message?.text);
}

async function leaveScene(ctx) {
  clearForm(ctx);

  if (ctx.scene?.current) {
    await ctx.scene.leave();
  }
}

async function cancelScene(ctx) {
  logger.info('Designer project request form cancelled.', { userId: ctx.from?.id });
  await leaveScene(ctx);
  await replyWithMainMenu(ctx, DESIGNER_PROJECT_FORM_TEXTS.cancelled);
}

async function restartFromStart(ctx) {
  logger.info('Designer project request form restarted with /start.', { userId: ctx.from?.id });
  await leaveScene(ctx);
  await replyWithStart(ctx, BOT_TEXTS.start(config.botName));
}

async function tryHandleSceneCommand(ctx) {
  const text = getTextMessage(ctx);

  if (text === FORM_BUTTONS.CANCEL || text === '/cancel') {
    await cancelScene(ctx);
    return true;
  }

  if (text === '/start') {
    await restartFromStart(ctx);
    return true;
  }

  return false;
}

async function enterScene(ctx) {
  logger.info('Designer project request form entered.', { userId: ctx.from?.id });
  initializeForm(ctx);
  await ctx.reply(PERSONAL_DATA_TEXTS.consent, formConsentKeyboard);
  return ctx.wizard.next();
}

async function handleConsent(ctx) {
  if (await tryHandleSceneCommand(ctx)) {
    return undefined;
  }

  const userChoice = getTextMessage(ctx);

  if (userChoice !== FORM_BUTTONS.CONSENT) {
    await ctx.reply(PERSONAL_DATA_TEXTS.consentChoiceOnly, formConsentKeyboard);
    return undefined;
  }

  await ctx.reply(DESIGNER_PROJECT_FORM_TEXTS.intro, formCancelKeyboard);
  return ctx.wizard.next();
}

function saveParsedRequest(ctx, parsedData) {
  updateFormField(ctx, 'fullName', parsedData.fullName);
  updateFormField(ctx, 'phone', parsedData.phone);
  updateFormField(ctx, 'description', parsedData.description);
}

async function handleProjectRequestInput(ctx) {
  if (await tryHandleSceneCommand(ctx)) {
    return undefined;
  }

  if (!ctx.message?.text) {
    await ctx.reply(DESIGNER_PROJECT_FORM_TEXTS.textOnly, formCancelKeyboard);
    return undefined;
  }

  const parseResult = parseDesignerProjectMessage(ctx.message.text);

  if (!parseResult.isValid) {
    const errorText = parseResult.reason === 'phone'
      ? DESIGNER_PROJECT_FORM_TEXTS.phoneNotFound
      : DESIGNER_PROJECT_FORM_TEXTS.incompleteRequest;

    await ctx.reply(errorText, formCancelKeyboard);
    return undefined;
  }

  saveParsedRequest(ctx, parseResult.data);

  await ctx.reply(
    DESIGNER_PROJECT_FORM_TEXTS.confirmation(buildDesignerProjectSummary(getForm(ctx))),
    formConfirmKeyboard,
  );

  return ctx.wizard.next();
}

async function handleConfirmation(ctx) {
  if (await tryHandleSceneCommand(ctx)) {
    return undefined;
  }

  const userChoice = getTextMessage(ctx);

  if (userChoice !== FORM_BUTTONS.CONFIRM) {
    await ctx.reply(DESIGNER_PROJECT_FORM_TEXTS.confirmChoiceOnly, formConfirmKeyboard);
    return undefined;
  }

  if (isSubmissionInProgress(ctx)) {
    await ctx.reply(DESIGNER_PROJECT_FORM_TEXTS.alreadySubmitting, formConfirmKeyboard);
    return undefined;
  }

  const payload = buildDesignerProjectNotificationPayload(ctx);
  const groupMessage = buildDesignerProjectLeadMessage(payload);
  const spreadsheetRecord = buildDesignerProjectSpreadsheetRecord(ctx);

  setSubmissionInProgress(ctx, true);

  try {
    const deliveryResult = await deliverLead({
      ctx,
      groupMessage,
      spreadsheetRecord,
      appendToSheet: appendDesignerProjectSubmission,
      leadType: 'designer project request form',
    });

    if (!deliveryResult.isSentToGroup) {
      await ctx.reply(DESIGNER_PROJECT_FORM_TEXTS.sendError, formConfirmKeyboard);
      return undefined;
    }
  } finally {
    setSubmissionInProgress(ctx, false);
  }

  logger.info('Designer project request form successfully sent.', {
    userId: ctx.from?.id,
    groupChatId: config.groupChatId,
  });

  await leaveScene(ctx);
  await replyWithMainMenu(ctx, DESIGNER_PROJECT_FORM_TEXTS.success);
  return undefined;
}

const designerProjectFormScene = new Scenes.WizardScene(
  SCENE_IDS.DESIGNER_PROJECT_REQUEST,
  enterScene,
  handleConsent,
  handleProjectRequestInput,
  handleConfirmation,
);

module.exports = {
  designerProjectFormScene,
};
