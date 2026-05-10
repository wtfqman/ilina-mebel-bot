const { FORM_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

const formSkipKeyboard = buildReplyKeyboard([
  [FORM_BUTTONS.SKIP],
  [FORM_BUTTONS.CANCEL],
]);

module.exports = {
  formSkipKeyboard,
};
