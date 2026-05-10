const { Markup } = require('telegraf');

function buildReplyKeyboard(rows) {
  return Markup.keyboard(rows).resize();
}

module.exports = {
  buildReplyKeyboard,
};
