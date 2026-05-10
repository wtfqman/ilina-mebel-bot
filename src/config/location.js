const LOCATION_INFO = Object.freeze({
  title: '📍 Как нас найти:',
  address: 'просп. Салавата Юлаева, 99/1, БЦ Аура',
  labels: Object.freeze({
    schedule: '🕒 Режим работы:',
    entrance: '🚪 Вход:',
  }),
  holidayNotice: '⚠️ В праздничные дни график работы уточняйте по телефону:',
  phone: '📞 +7 (917) 481-06-73',
  parking: '🅿️ Для покупателей и дизайнеров предусмотрена удобная парковка.',
  spaces: Object.freeze([
    Object.freeze({
      title: '🏠 Салон мебели Enza Home',
      schedule: Object.freeze([
        'пн–сб: 10:00–20:00',
        'вс: 11:00–19:00',
      ]),
      entrance: Object.freeze(['красная линия']),
    }),
    Object.freeze({
      title: '🪑 Библиотека интерьеров «Куб»',
      schedule: Object.freeze(['пн–сб: 10:00–19:00']),
      entrance: Object.freeze(['справа с торца здания']),
    }),
  ]),
});

module.exports = {
  LOCATION_INFO,
};
