const { CATALOG_NAVIGATION_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

const catalogPdfActionsKeyboard = buildReplyKeyboard([
  [CATALOG_NAVIGATION_BUTTONS.BACK, CATALOG_NAVIGATION_BUTTONS.CATALOG],
  [CATALOG_NAVIGATION_BUTTONS.MENU],
]);

module.exports = {
  catalogPdfActionsKeyboard,
};
