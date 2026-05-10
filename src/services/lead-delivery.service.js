const { logger } = require('../config/logger');
const { sendMessageToGroup } = require('./group-notification.service');

async function deliverLead({
  ctx,
  groupMessage,
  groupChatId,
  spreadsheetRecord,
  appendToSheet,
  leadType,
}) {
  let isSentToGroup = false;

  try {
    isSentToGroup = await sendMessageToGroup(ctx, groupMessage, groupChatId);
  } catch (error) {
    logger.error(`Failed to send ${leadType} to Telegram group.`, {
      message: error.message,
      userId: ctx.from?.id,
    });

    return {
      isSentToGroup: false,
      isSavedToGoogleSheets: false,
    };
  }

  if (!isSentToGroup) {
    return {
      isSentToGroup: false,
      isSavedToGoogleSheets: false,
    };
  }

  let isSavedToGoogleSheets = false;

  if (typeof appendToSheet === 'function') {
    try {
      isSavedToGoogleSheets = await appendToSheet(spreadsheetRecord);
    } catch (error) {
      logger.error(`Failed to save ${leadType} to Google Sheets.`, {
        message: error.message,
        userId: ctx.from?.id,
      });
    }

    if (!isSavedToGoogleSheets) {
      logger.warn(`${leadType} was sent to Telegram group but not saved to Google Sheets.`, {
        userId: ctx.from?.id,
      });
    }
  }

  return {
    isSentToGroup: true,
    isSavedToGoogleSheets,
  };
}

module.exports = {
  deliverLead,
};
