const { FAQ_ITEMS } = require('../config/faq');

function buildFaqItem(item, index) {
  return [
    `${index + 1}. ${item.question}`,
    `Ответ: ${item.answer}`,
  ].join('\n');
}

function buildFaqMessage() {
  const intro = [
    'Раздел "Частые вопросы".',
    'Ниже собраны популярные вопросы и короткие ответы по работе компании.',
  ].join('\n\n');

  const faqBlocks = FAQ_ITEMS.map(buildFaqItem).join('\n\n');

  return [intro, faqBlocks].join('\n\n');
}

module.exports = {
  buildFaqMessage,
};
