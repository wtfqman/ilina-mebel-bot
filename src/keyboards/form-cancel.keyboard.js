const { FORM_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

const formCancelKeyboard = buildReplyKeyboard([[FORM_BUTTONS.CANCEL]]);

module.exports = {
  formCancelKeyboard,
};
