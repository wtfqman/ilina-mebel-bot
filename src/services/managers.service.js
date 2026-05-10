const { MANAGERS } = require('../config/managers');

function formatOptionalValue(value) {
  return value || '—';
}

function buildManagerBlock(manager, index) {
  const lines = [
    `${index + 1}. ${manager.name}`,
    `Телефон: ${formatOptionalValue(manager.phone)}`,
    `Email: ${formatOptionalValue(manager.email)}`,
  ];

  return lines.join('\n');
}

function buildManagersMessage() {
  const intro = [
    'Раздел "Менеджеры".',
    'Ниже список специалистов, с которыми можно связаться напрямую.',
  ].join('\n\n');

  const managerBlocks = MANAGERS.map(buildManagerBlock).join('\n\n');

  return [intro, managerBlocks].join('\n\n');
}

module.exports = {
  buildManagersMessage,
};
