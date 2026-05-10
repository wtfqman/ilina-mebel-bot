const { ROLE_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

const roleSelectionKeyboard = buildReplyKeyboard([
  [ROLE_BUTTONS.CUSTOMER, ROLE_BUTTONS.DESIGNER],
]);

module.exports = {
  roleSelectionKeyboard,
};
