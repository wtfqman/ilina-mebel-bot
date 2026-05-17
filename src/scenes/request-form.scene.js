const { Scenes } = require('telegraf');

const { config } = require('../config/env');
const { logger } = require('../config/logger');
const { BOT_TEXTS } = require('../constants/bot-texts');
const { FORM_BUTTONS } = require('../constants/buttons');
const { REQUEST_FORM_TEXTS } = require('../constants/request-form-texts');
const { SCENE_IDS } = require('../constants/scenes');
const { formCancelKeyboard } = require('../keyboards/form-cancel.keyboard');
const { formConfirmKeyboard } = require('../keyboards/form-confirm.keyboard');
const { requestContactKeyboard } = require('../keyboards/request-contact.keyboard');
const { appendCustomerRequestSubmission } = require('../services/google-sheets.service');
const { buildRequestLeadMessage } = require('../services/group-notification.service');
const { deliverLead } = require('../services/lead-delivery.service');
const { replyWithMainMenu, replyWithStart } = require('../services/navigation.service');
const {
  buildRequestNotificationPayload,
  buildRequestSpreadsheetRecord,
  buildRequestSummary,
  clearForm,
  getForm,
  initializeForm,
  isSubmissionInProgress,
  parseCustomerRequestDetailsMessage,
  setSubmissionInProgress,
  updateFormField,
} = require('../services/request-form.service');
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
  logger.info('Customer request form cancelled.', { userId: ctx.from?.id });
  await leaveScene(ctx);
  await replyWithMainMenu(ctx, REQUEST_FORM_TEXTS.cancelled);
}

async function restartFromStart(ctx) {
  logger.info('Customer request form restarted with /start.', { userId: ctx.from?.id });
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
  logger.info('Customer request form entered.', { userId: ctx.from?.id });
  initializeForm(ctx);
  await ctx.reply(REQUEST_FORM_TEXTS.phoneRequest, requestContactKeyboard);
  return ctx.wizard.next();
}

async function handleContact(ctx) {
  if (await tryHandleSceneCommand(ctx)) {
    return undefined;
  }

  if (!ctx.message?.contact?.phone_number) {
    await ctx.reply(REQUEST_FORM_TEXTS.contactRequired, requestContactKeyboard);
    return undefined;
  }

  const phone = getContactPhone(ctx);

  if (!isValidPhoneNumber(phone)) {
    await ctx.reply(REQUEST_FORM_TEXTS.invalidContact, requestContactKeyboard);
    return undefined;
  }

  updateFormField(ctx, 'phone', phone);
  await ctx.reply(REQUEST_FORM_TEXTS.detailsPrompt, formCancelKeyboard);
  return ctx.wizard.next();
}

function saveParsedRequestDetails(ctx, parsedData) {
  updateFormField(ctx, 'name', parsedData.name);
  updateFormField(ctx, 'requestText', parsedData.requestText);
}

async function handleRequestDetails(ctx) {
  if (await tryHandleSceneCommand(ctx)) {
    return undefined;
  }

  if (!ctx.message?.text) {
    await ctx.reply(REQUEST_FORM_TEXTS.textOnly, formCancelKeyboard);
    return undefined;
  }

  const parseResult = parseCustomerRequestDetailsMessage(ctx.message.text);

  if (!parseResult.isValid) {
    await ctx.reply(REQUEST_FORM_TEXTS.incompleteRequest, formCancelKeyboard);
    return undefined;
  }

  saveParsedRequestDetails(ctx, parseResult.data);

  await ctx.reply(
    REQUEST_FORM_TEXTS.confirmation(buildRequestSummary(getForm(ctx))),
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
    await ctx.reply(REQUEST_FORM_TEXTS.confirmChoiceOnly, formConfirmKeyboard);
    return undefined;
  }

  if (isSubmissionInProgress(ctx)) {
    await ctx.reply(REQUEST_FORM_TEXTS.alreadySubmitting, formConfirmKeyboard);
    return undefined;
  }

  const payload = buildRequestNotificationPayload(ctx);
  const groupMessage = buildRequestLeadMessage(payload);
  const spreadsheetRecord = buildRequestSpreadsheetRecord(ctx);

  setSubmissionInProgress(ctx, true);

  try {
    const deliveryResult = await deliverLead({
      ctx,
      groupMessage,
      groupChatId: config.customerRequestGroupChatId,
      spreadsheetRecord,
      appendToSheet: appendCustomerRequestSubmission,
      leadType: 'customer request form',
    });

    if (!deliveryResult.isSentToGroup) {
      await ctx.reply(REQUEST_FORM_TEXTS.sendError, formConfirmKeyboard);
      return undefined;
    }
  } finally {
    setSubmissionInProgress(ctx, false);
  }

  logger.info('Customer request form successfully sent.', {
    userId: ctx.from?.id,
    groupChatId: config.customerRequestGroupChatId,
  });

  await leaveScene(ctx);
  await replyWithMainMenu(ctx, REQUEST_FORM_TEXTS.success);
  return undefined;
}

const requestFormScene = new Scenes.WizardScene(
  SCENE_IDS.CUSTOMER_REQUEST,
  enterScene,
  handleContact,
  handleRequestDetails,
  handleConfirmation,
);

module.exports = {
  requestFormScene,
};
