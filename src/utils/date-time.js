function formatDateTime(value = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(value);
}

module.exports = {
  formatDateTime,
};
