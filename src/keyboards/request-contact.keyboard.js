const { Markup } = require('telegraf');

const { FORM_BUTTONS } = require('../constants/buttons');

const requestContactKeyboard = Markup.keyboard([
  [Markup.button.contactRequest(FORM_BUTTONS.SEND_PHONE)],
  [FORM_BUTTONS.CANCEL],
]).resize();

module.exports = {
  requestContactKeyboard,
};
