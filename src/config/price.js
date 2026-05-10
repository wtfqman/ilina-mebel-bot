const { config } = require('./env');

const PRICE_PDF_FILE = 'price.pdf';
const PRICE_TELEGRAM_FILE_ID = config.priceTelegramFileId;

const PRICE_SUMMARY = Object.freeze({
  intro: [
    'Краткий прайс по сервисным услугам и дополнительным работам.',
    'Точные суммы зависят от адреса, объема заказа, этажности, состава техники и особенностей монтажа.',
    'Ниже основные категории. Подробная версия также доступна в PDF.',
  ].join('\n\n'),
  items: Object.freeze([
    Object.freeze({
      title: 'Доставка по Уфе и пригородам',
      description: 'Стоимость рассчитывается по маршруту, объему заказа и условиям подъезда.',
    }),
    Object.freeze({
      title: 'Межгород',
      description: 'Рассчитывается индивидуально по направлению, километражу и формату отгрузки.',
    }),
    Object.freeze({
      title: 'Установка техники',
      description: 'Считается отдельно в зависимости от состава техники и сложности подключения.',
    }),
    Object.freeze({
      title: 'Вырезы',
      description: 'Стоимость зависит от типа материала, количества и конфигурации вырезов.',
    }),
    Object.freeze({
      title: 'Подъем мебели',
      description: 'Рассчитывается с учетом этажности, наличия лифта и габаритов изделий.',
    }),
    Object.freeze({
      title: 'Подъем техники',
      description: 'Тариф зависит от веса, упаковки, количества единиц и условий подъема.',
    }),
    Object.freeze({
      title: 'Выезд установщика',
      description: 'Считается отдельно для монтажных и сервисных выездов.',
    }),
    Object.freeze({
      title: 'Вызов мастера',
      description: 'Стоимость зависит от типа задачи и необходимости повторного визита.',
    }),
  ]),
});

module.exports = {
  PRICE_SUMMARY,
  PRICE_PDF_FILE,
  PRICE_TELEGRAM_FILE_ID,
};
