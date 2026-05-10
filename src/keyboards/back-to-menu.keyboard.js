const { COMMON_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

const backToMenuKeyboard = buildReplyKeyboard([[COMMON_BUTTONS.BACK_TO_MENU]]);

module.exports = {
  backToMenuKeyboard,
};
