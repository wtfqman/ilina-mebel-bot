const { Scenes } = require('telegraf');

const { config } = require('../config/env');
const { logger } = require('../config/logger');
const { BOT_TEXTS } = require('../constants/bot-texts');
const { FORM_BUTTONS } = require('../constants/buttons');
const { CONSULTATION_FORM_TEXTS } = require('../constants/consultation-form-texts');
const { PERSONAL_DATA_TEXTS } = require('../constants/personal-data-texts');
const { SCENE_IDS } = require('../constants/scenes');
const { formCancelKeyboard } = require('../keyboards/form-cancel.keyboard');
const { formConfirmKeyboard } = require('../keyboards/form-confirm.keyboard');
const { formConsentKeyboard } = require('../keyboards/form-consent.keyboard');
const { requestContactKeyboard } = require('../keyboards/request-contact.keyboard');
const { appendConsultationSubmission } = require('../services/google-sheets.service');
const { buildConsultationLeadMessage } = require('../services/group-notification.service');
const { deliverLead } = require('../services/lead-delivery.service');
const { replyWithMainMenu, replyWithStart } = require('../services/navigation.service');
const {
  buildConsultationNotificationPayload,
  buildConsultationSpreadsheetRecord,
  buildConsultationSummary,
  clearForm,
  formatAvailableManagersText,
  getForm,
  initializeForm,
  isSubmissionInProgress,
  parseConsultationDetailsMessage,
  setSubmissionInProgress,
  updateFormField,
} = require('../services/consultation-form.service');
const {
  isValidPhoneNumber,
  normalizePhoneNumber,
  sanitizeTextInput,
} = require('../utils/validation');

function getTextMessage(ctx) {
  return sanitizeTextInput(ctx.message?.text);
}

function getContactPhone(ctx) {
  return normalizePhoneNumber(ctx.message?.contact?.phone_number);
}

async function leaveScene(ctx) {
  clearForm(ctx);

  if (ctx.scene?.current) {
    await ctx.scene.leave();
  }
}

async function cancelScene(ctx) {
  logger.info('Consultation form cancelled.', { userId: ctx.from?.id });
  await leaveScene(ctx);
  await replyWithMainMenu(ctx, CONSULTATION_FORM_TEXTS.cancelled);
}

async function restartFromStart(ctx) {
  logger.info('Consultation form restarted with /start.', { userId: ctx.from?.id });
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
  logger.info('Consultation form entered.', { userId: ctx.from?.id });
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

  await ctx.reply(CONSULTATION_FORM_TEXTS.phoneRequest, requestContactKeyboard);
  return ctx.wizard.next();
}

async function handleContact(ctx) {
  if (await tryHandleSceneCommand(ctx)) {
    return undefined;
  }

  if (!ctx.message?.contact?.phone_number) {
    await ctx.reply(CONSULTATION_FORM_TEXTS.contactRequired, requestContactKeyboard);
    return undefined;
  }

  const phone = getContactPhone(ctx);

  if (!isValidPhoneNumber(phone)) {
    await ctx.reply(CONSULTATION_FORM_TEXTS.invalidContact, requestContactKeyboard);
    return undefined;
  }

  updateFormField(ctx, 'phone', phone);
  await ctx.reply(CONSULTATION_FORM_TEXTS.detailsPrompt, formCancelKeyboard);
  return ctx.wizard.next();
}

function saveParsedConsultationDetails(ctx, parsedData) {
  updateFormField(ctx, 'name', parsedData.name);
  updateFormField(ctx, 'manager', parsedData.manager);
  updateFormField(ctx, 'convenientTime', parsedData.convenientTime);
}

async function handleConsultationDetails(ctx) {
  if (await tryHandleSceneCommand(ctx)) {
    return undefined;
  }

  if (!ctx.message?.text) {
    await ctx.reply(CONSULTATION_FORM_TEXTS.textOnly, formCancelKeyboard);
    return undefined;
  }

  const parseResult = parseConsultationDetailsMessage(ctx.message.text);

  if (!parseResult.isValid) {
    const errorText = parseResult.reason === 'manager'
      ? CONSULTATION_FORM_TEXTS.managerChoiceOnly(formatAvailableManagersText())
      : CONSULTATION_FORM_TEXTS.incompleteDetails;

    await ctx.reply(errorText, formCancelKeyboard);
    return undefined;
  }

  saveParsedConsultationDetails(ctx, parseResult.data);

  await ctx.reply(
    CONSULTATION_FORM_TEXTS.confirmation(buildConsultationSummary(getForm(ctx))),
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
    await ctx.reply(CONSULTATION_FORM_TEXTS.confirmChoiceOnly, formConfirmKeyboard);
    return undefined;
  }

  if (isSubmissionInProgress(ctx)) {
    await ctx.reply(CONSULTATION_FORM_TEXTS.alreadySubmitting, formConfirmKeyboard);
    return undefined;
  }

  const payload = buildConsultationNotificationPayload(ctx);
  const groupMessage = buildConsultationLeadMessage(payload);
  const spreadsheetRecord = buildConsultationSpreadsheetRecord(ctx);

  setSubmissionInProgress(ctx, true);

  try {
    const deliveryResult = await deliverLead({
      ctx,
      groupMessage,
      groupChatId: config.customerRequestGroupChatId,
      spreadsheetRecord,
      appendToSheet: appendConsultationSubmission,
      leadType: 'consultation form',
    });

    if (!deliveryResult.isSentToGroup) {
      await ctx.reply(CONSULTATION_FORM_TEXTS.sendError, formConfirmKeyboard);
      return undefined;
    }
  } finally {
    setSubmissionInProgress(ctx, false);
  }

  logger.info('Consultation form successfully sent.', {
    userId: ctx.from?.id,
    groupChatId: config.customerRequestGroupChatId,
  });

  await leaveScene(ctx);
  await replyWithMainMenu(ctx, CONSULTATION_FORM_TEXTS.success);
  return undefined;
}

const consultationFormScene = new Scenes.WizardScene(
  SCENE_IDS.CONSULTATION,
  enterScene,
  handleConsent,
  handleContact,
  handleConsultationDetails,
  handleConfirmation,
);

module.exports = {
  consultationFormScene,
};
