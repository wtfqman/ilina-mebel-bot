const SECTION_TEXTS = {
  customerCatalogsIntro: [
    'Каталоги для заказчика.',
    'Здесь собраны основные направления: готовая мебель, мебель на заказ, стеновые панели и бытовая техника.',
    'Откройте нужный блок ниже: PDF отправятся прямо в чат, а внешние сайты откроются через кнопку.',
  ].join('\n\n'),

  designerCatalogsIntro: [
    'Каталоги для дизайнера.',
    'Раздел рассчитан на подбор материалов и продуктовых решений под проект.',
    'Если нужного PDF пока нет, можно сразу отправить запрос под проект.',
  ].join('\n\n'),

  designerModelsIntro: [
    'База 3D моделей пополняется постепенно.',
    'Откройте нужный раздел ниже. Если нужной позиции пока нет, можно сразу запросить 3D модель.',
  ].join('\n\n'),

  cooperationIntro: [
    'Раздел для новых дизайнеров.',
    'Если вы хотите уточнить условия сотрудничества, заполните короткую анкету, и команда свяжется с вами.',
  ].join('\n\n'),

  catalogSubmenu(itemTitle) {
    return [
      `${itemTitle}`,
      'Выберите нужную подкатегорию ниже.',
    ].join('\n\n');
  },

  catalogPdf(itemTitle) {
    return [
      `${itemTitle}`,
      'Отправляю доступный PDF-каталог.',
    ].join('\n\n');
  },

  catalogPdfSent(itemTitle) {
    return [
      `${itemTitle}`,
      'PDF-каталог отправлен. Можно вернуться назад, открыть общий каталог или перейти в меню.',
    ].join('\n\n');
  },

  catalogPdfUnavailable(itemTitle) {
    return [
      `${itemTitle}`,
      'Не удалось отправить PDF-каталог. Материал временно недоступен, но бот продолжает работать.',
      'Попробуйте открыть другой раздел или вернитесь в меню.',
    ].join('\n\n');
  },

  catalogLink(itemTitle, description) {
    return [
      `${itemTitle}`,
      description || 'Внешний каталог доступен на сайте поставщика.',
    ].join('\n\n');
  },

  catalogLinkUnavailable(itemTitle) {
    return [
      `${itemTitle}`,
      'Ссылка для этого раздела пока не настроена.',
    ].join('\n\n');
  },

  catalogRequest(itemTitle) {
    return [
      `${itemTitle}`,
      'Открою форму заявки, чтобы менеджер смог подготовить расчет или подбор.',
    ].join('\n\n');
  },

  modelFile(itemTitle) {
    return [
      `${itemTitle}`,
      'Материал найден. Отправляю файл ниже.',
    ].join('\n\n');
  },

  modelRequest(itemTitle) {
    return [
      `${itemTitle}`,
      'Нужной 3D модели пока нет в базе. Можно запросить ее через форму под проект.',
    ].join('\n\n');
  },
};

module.exports = {
  SECTION_TEXTS,
};
