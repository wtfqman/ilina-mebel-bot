const { COMMON_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

function buildCatalogKeyboard(items, extraActions = []) {
  const itemRows = [];

  for (let index = 0; index < items.length; index += 2) {
    itemRows.push(items.slice(index, index + 2).map((item) => item.title));
  }

  const actionRows = [];

  for (let index = 0; index < extraActions.length; index += 2) {
    actionRows.push(extraActions.slice(index, index + 2));
  }

  return buildReplyKeyboard([
    ...itemRows,
    ...actionRows,
    [COMMON_BUTTONS.BACK_TO_MENU],
  ]);
}

module.exports = {
  buildCatalogKeyboard,
};
