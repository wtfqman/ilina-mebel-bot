const { COMMON_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

function normalizeActionRows(primaryActions = []) {
  if (!primaryActions.length) {
    return [];
  }

  const rows = [];

  for (let index = 0; index < primaryActions.length; index += 2) {
    rows.push(primaryActions.slice(index, index + 2));
  }

  return rows;
}

function createSectionActionsKeyboard(primaryActions = []) {
  return buildReplyKeyboard([
    ...normalizeActionRows(primaryActions),
    [COMMON_BUTTONS.BACK_TO_MENU],
  ]);
}

module.exports = {
  createSectionActionsKeyboard,
};
