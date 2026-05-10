const { FIRST_AVAILABLE_MANAGER_OPTION, MANAGERS } = require('../config/managers');
const { FORM_BUTTONS } = require('../constants/buttons');
const { buildReplyKeyboard } = require('./build-reply-keyboard');

function buildManagerRows() {
  const rows = [];

  for (let index = 0; index < MANAGERS.length; index += 2) {
    rows.push(MANAGERS.slice(index, index + 2).map((manager) => manager.name));
  }

  rows.push([FIRST_AVAILABLE_MANAGER_OPTION.name]);
  rows.push([FORM_BUTTONS.CANCEL]);

  return rows;
}

const consultationManagerKeyboard = buildReplyKeyboard(buildManagerRows());

module.exports = {
  consultationManagerKeyboard,
};
