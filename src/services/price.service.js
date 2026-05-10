const { PRICE_SUMMARY } = require('../config/price');

function buildPriceMessage() {
  const items = PRICE_SUMMARY.items
    .map((item) => `${item.title}\n${item.description}`)
    .join('\n\n');

  return [PRICE_SUMMARY.intro, items].join('\n\n');
}

module.exports = {
  buildPriceMessage,
};
