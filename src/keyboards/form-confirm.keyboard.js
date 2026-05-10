const { FORM_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

const formConfirmKeyboard = buildReplyKeyboard([
  [FORM_BUTTONS.CONFIRM],
  [FORM_BUTTONS.CANCEL],
]);

module.exports = {
  formConfirmKeyboard,
};
