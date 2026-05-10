const { FORM_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

const formConsentKeyboard = buildReplyKeyboard([
  [FORM_BUTTONS.CONSENT],
  [FORM_BUTTONS.CANCEL],
]);

module.exports = {
  formConsentKeyboard,
};
