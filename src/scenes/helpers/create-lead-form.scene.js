const { Scenes } = require('telegraf');

const { config } = require('../../config/env');
const { logger } = require('../../config/logger');
const { BOT_TEXTS } = require('../../constants/bot-texts');
const { FORM_BUTTONS } = require('../../constants/buttons');
const { PERSONAL_DATA_TEXTS } = require('../../constants/personal-data-texts');
const { formCancelKeyboard } = require('../../keyboards/form-cancel.keyboard');
const { formConsentKeyboard } = require('../../keyboards/form-consent.keyboard');
const { formConfirmKeyboard } = require('../../keyboards/form-confirm.keyboard');
const { formSkipKeyboard } = require('../../keyboards/form-skip.keyboard');
const { deliverLead } = require('../../services/lead-delivery.service');
const { replyWithMainMenu, replyWithStart } = require('../../services/navigation.service');
const {
  isNonEmptyText,
  isValidPhoneNumber,
  normalizePhoneNumber,
  sanitizeTextInput,
} = require('../../utils/validation');

function getTextMessage(ctx) {
  return sanitizeTextInput(ctx.message?.text);
}

function getPhoneInput(ctx) {
  if (ctx.message?.contact?.phone_number) {
    return normalizePhoneNumber(ctx.message.contact.phone_number);
  }

  return normalizePhoneNumber(ctx.message?.text);
}

function resolveStepKeyboard(step) {
  if (typeof step.keyboard === 'function') {
    return step.keyboard();
  }

  if (step.keyboard) {
    return step.keyboard;
  }

  if (step.type === 'optionalText') {
    return formSkipKeyboard;
  }

  return formCancelKeyboard;
}

async function askForStep(ctx, step, introText) {
  const lines = [];

  if (introText) {
    lines.push(introText);
  }

  lines.push(step.prompt);

  await ctx.reply(lines.join('\n\n'), resolveStepKeyboard(step));
}

function createLeadFormScene({
  sceneId,
  sceneName,
  texts,
  state,
  steps,
  buildSummary,
  buildNotificationPayload,
  buildSpreadsheetRecord,
  buildGroupMessage,
  appendToSheet,
  leadType,
}) {
  async function leaveScene(ctx) {
    state.clearForm(ctx);

    if (ctx.scene?.current) {
      await ctx.scene.leave();
    }
  }

  async function cancelScene(ctx) {
    logger.info(`${sceneName} cancelled.`, { userId: ctx.from?.id });
    await leaveScene(ctx);
    await replyWithMainMenu(ctx, texts.cancelled);
  }

  async function restartFromStart(ctx) {
    logger.info(`${sceneName} restarted with /start.`, { userId: ctx.from?.id });
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
    logger.info(`${sceneName} entered.`, { userId: ctx.from?.id });
    state.initializeForm(ctx);
    await ctx.reply(PERSONAL_DATA_TEXTS.consent, formConsentKeyboard);
    return ctx.wizard.next();
  }

  async function handleConsentStep(ctx) {
    if (await tryHandleSceneCommand(ctx)) {
      return undefined;
    }

    const userChoice = getTextMessage(ctx);

    if (userChoice !== FORM_BUTTONS.CONSENT) {
      await ctx.reply(PERSONAL_DATA_TEXTS.consentChoiceOnly, formConsentKeyboard);
      return undefined;
    }

    await askForStep(ctx, steps[0], texts.intro);
    return ctx.wizard.next();
  }

  function createStepHandler(step, nextStep) {
    return async (ctx) => {
      if (await tryHandleSceneCommand(ctx)) {
        return undefined;
      }

      let value = '';

      if (step.type === 'phone') {
        value = getPhoneInput(ctx);

        if (!value) {
          await ctx.reply(texts.textOnly(step.label), resolveStepKeyboard(step));
          return undefined;
        }

        if (!isValidPhoneNumber(value)) {
          await ctx.reply(texts.invalidPhone, resolveStepKeyboard(step));
          return undefined;
        }
      } else if (step.type === 'choice') {
        value = getTextMessage(ctx);

        if (!value || !step.isValidChoice(value)) {
          await ctx.reply(step.invalidChoiceText, resolveStepKeyboard(step));
          return undefined;
        }
      } else if (step.type === 'optionalText') {
        value = getTextMessage(ctx);

        if (value === FORM_BUTTONS.SKIP) {
          state.updateFormField(ctx, step.field, step.skipValue || '');

          if (nextStep) {
            await askForStep(ctx, nextStep);
            return ctx.wizard.next();
          }

          const summary = buildSummary(ctx);
          await ctx.reply(texts.confirmation(summary), formConfirmKeyboard);
          return ctx.wizard.next();
        }

        if (!value) {
          await ctx.reply(texts.textOnly(step.label), resolveStepKeyboard(step));
          return undefined;
        }
      } else {
        value = getTextMessage(ctx);

        if (!value) {
          await ctx.reply(texts.textOnly(step.label), resolveStepKeyboard(step));
          return undefined;
        }

        if (!isNonEmptyText(value)) {
          await ctx.reply(texts.emptyValue(step.label), resolveStepKeyboard(step));
          return undefined;
        }
      }

      state.updateFormField(ctx, step.field, value);

      if (nextStep) {
        await askForStep(ctx, nextStep);
        return ctx.wizard.next();
      }

      const summary = buildSummary(ctx);
      await ctx.reply(texts.confirmation(summary), formConfirmKeyboard);
      return ctx.wizard.next();
    };
  }

  async function handleConfirmationStep(ctx) {
    if (await tryHandleSceneCommand(ctx)) {
      return undefined;
    }

    const userChoice = getTextMessage(ctx);

    if (userChoice !== FORM_BUTTONS.CONFIRM) {
      await ctx.reply(texts.confirmChoiceOnly, formConfirmKeyboard);
      return undefined;
    }

    if (state.isSubmissionInProgress(ctx)) {
      await ctx.reply(texts.alreadySubmitting, formConfirmKeyboard);
      return undefined;
    }

    const payload = buildNotificationPayload(ctx);
    const groupMessage = buildGroupMessage(payload);
    const spreadsheetRecord = buildSpreadsheetRecord(ctx);

    state.setSubmissionInProgress(ctx, true);

    try {
      const deliveryResult = await deliverLead({
        ctx,
        groupMessage,
        spreadsheetRecord,
        appendToSheet,
        leadType,
      });

      if (!deliveryResult.isSentToGroup) {
        await ctx.reply(texts.sendError, formConfirmKeyboard);
        return undefined;
      }
    } finally {
      state.setSubmissionInProgress(ctx, false);
    }

    logger.info(`${sceneName} successfully sent.`, {
      userId: ctx.from?.id,
      groupChatId: config.groupChatId,
    });

    await leaveScene(ctx);
    await replyWithMainMenu(ctx, texts.success);
    return undefined;
  }

  const handlers = steps.map((step, index) => createStepHandler(step, steps[index + 1]));

  return new Scenes.WizardScene(
    sceneId,
    enterScene,
    handleConsentStep,
    ...handlers,
    handleConfirmationStep,
  );
}

module.exports = {
  createLeadFormScene,
};
