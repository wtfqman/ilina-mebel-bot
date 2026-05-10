function createPdfItem({
  id,
  title,
  audience = 'both',
  telegramFileId = '',
  pdfPath = '',
  description = '',
}) {
  return Object.freeze({
    id,
    title,
    type: 'pdf',
    telegramFileId,
    pdfPath,
    audience,
    children: Object.freeze([]),
    description,
  });
}

function createLinkItem({
  id,
  title,
  url,
  audience = 'both',
  description = '',
}) {
  return Object.freeze({
    id,
    title,
    type: 'link',
    url,
    audience,
    children: Object.freeze([]),
    description,
  });
}

function createRequestItem({
  id,
  title,
  audience = 'customer',
  form = '',
  description = '',
}) {
  return Object.freeze({
    id,
    title,
    type: 'request',
    form,
    audience,
    children: Object.freeze([]),
    description,
  });
}

function createSubmenuItem({
  id,
  title,
  audience = 'customer',
  children = [],
  description = '',
}) {
  return Object.freeze({
    id,
    title,
    type: 'submenu',
    audience,
    children: Object.freeze(children),
    description,
  });
}

const CATALOGS = Object.freeze([
  createSubmenuItem({
    id: 'customer-ready-furniture',
    title: 'Готовая мебель',
    audience: 'both',
    description: 'PDF-каталоги и сайты поставщиков готовой мебели.',
    children: [
      createPdfItem({
        id: 'customer-ready-signal-2026',
        title: 'Signal 2026',
        telegramFileId:
          'BQACAgIAAxkBAAPZaeOLd0DZ74Nngdvcy4WSNQ9zlFoAAimlAALyyxlLP467Kkq-Mhg7BA',
        description: 'PDF-каталог готовой мебели Signal 2026.',
      }),
      createPdfItem({
        id: 'customer-ready-halmar-2026',
        title: 'HALMAR 2026',
        telegramFileId:
          'BQACAgIAAxkBAAPXaeOLYk0ctE6_182zxorTRYhn64UAAielAALyyxlL5zyhSDwZdxc7BA',
        description: 'PDF-каталог готовой мебели HALMAR 2026.',
      }),
      createPdfItem({
        id: 'customer-ready-stolburg-2025',
        title: 'Каталог СТОЛБУРГ 2025_февраль',
        telegramFileId:
          'BQACAgIAAxkBAAPhaeOLk_C-tOJsbq3gUTxdkeduYhMAAi-lAALyyxlLYDvdIsKVuKc7BA',
        description: 'PDF-каталог Столбург 2025.',
      }),
      createPdfItem({
        id: 'customer-ready-evanti-2025-2026',
        title: 'Каталог Эванти 2025-2026',
        telegramFileId:
          'BQACAgIAAxkBAAPjaeOLohwPDYG--DhorDBCXMQijwQAAjGlAALyyxlL8cppaPVXZC47BA',
        description: 'PDF-каталог Эванти 2025-2026.',
      }),
      createPdfItem({
        id: 'customer-ready-homelike-sofas',
        title: 'HomeLike диваны',
        telegramFileId:
          'BQACAgIAAxkBAAPlaeOLrpFZ3kshU8P9GQrqfERxNYoAAjKlAALyyxlLTml7jDhP4Yg7BA',
        description: 'PDF-каталог диванов HomeLike.',
      }),
      createPdfItem({
        id: 'customer-ready-homelike-beds',
        title: 'HomeLike кровати',
        telegramFileId:
          'BQACAgIAAxkBAAPnaeOLsi8-Ye1xbMFK-qLHD9ohTeYAAjSlAALyyxlLSz0dIllBjj47BA',
        description: 'PDF-каталог кроватей HomeLike.',
      }),
      createLinkItem({
        id: 'customer-ready-arooma',
        title: 'Arooma',
        url: 'https://mebel-arooma.ru/?ysclid=mnxbkz5suh37781228',
      }),
      createLinkItem({
        id: 'customer-ready-enza-home-russia',
        title: 'Enza Home Russia',
        url: 'https://www.enzahomerussia.ru/ru-RU/',
      }),
      createLinkItem({
        id: 'customer-ready-barcelona-design',
        title: 'Barcelona Design',
        url: 'https://www.barcelonadesign.ru/?utm_source=yandex&utm_medium=cpc&utm_campaign=MK_Komplektacia_pod_kluch&utm_content=1904878056602847923&utm_term=---autotargeting&etext=2202.qcz2uwPVE-7gzEgNyGQr7bF6l8BRHIurwmzQ8KGCc3LTZBfvMQUl-X6Ohc9qRkAEdXdsZWNhaHN0bG9qa3JyeA.8d4e10db717370c8149dfb079fa176d2a81e450f&yclid=177871886371258367&ybaip=1',
      }),
      createLinkItem({
        id: 'customer-ready-esf-moscow',
        title: 'ESF Moscow',
        url: 'https://esfmoscow.ru/furniture/Obedennie-gruppi',
      }),
      createLinkItem({
        id: 'customer-ready-evanty',
        title: 'Evanty',
        url: 'https://evanty.ru/',
      }),
      createLinkItem({
        id: 'customer-ready-woodville',
        title: 'Woodville',
        url: 'https://woodville.ru/catalog/stulya/page_16/',
      }),
      createLinkItem({
        id: 'customer-ready-zonko',
        title: 'Zonko',
        url: 'https://zonko.su/tables',
      }),
      createLinkItem({
        id: 'customer-ready-koza-home',
        title: 'Koza Home',
        url: 'https://koza-home.ru/',
      }),
      createLinkItem({
        id: 'customer-ready-clouddivan',
        title: 'Clouddivan',
        url: 'https://clouddivan.ru/?ysclid=mnxbizhsyq559020604',
      }),
      createLinkItem({
        id: 'customer-ready-andrea-mebel',
        title: 'Andrea Mebel',
        url: 'https://andrea-mebel.ru/',
      }),
    ],
  }),
  createSubmenuItem({
    id: 'customer-custom-furniture',
    title: 'Мебель на заказ',
    audience: 'both',
    description: 'Фасады, фурнитура и расчет мебели на заказ.',
    children: [
      createSubmenuItem({
        id: 'customer-custom-facades',
        title: 'Фасады',
        audience: 'both',
        children: [
          createPdfItem({
            id: 'customer-custom-orwood-facades',
            title: 'ORWOOD / каталог 2025 / мебельные фасады',
            telegramFileId:
              'BQACAgIAAxkBAAPfaeOLj4NFk-DdFmFUmiteQwMTdowAAi2lAALyyxlLdo16YdZpQb47BA',
            description: 'PDF-каталог фасадов ORWOOD.',
          }),
          createPdfItem({
            id: 'customer-custom-eterno',
            title: 'Eterno 2025',
            telegramFileId:
              'BQACAgIAAxkBAAPpaeOLtFterWcWF3qf9Vf5Smq78-AAAjalAALyyxlLPRZUW2coBFg7BA',
            description: 'PDF-каталог Eterno.',
          }),
        ],
      }),
      createSubmenuItem({
        id: 'customer-custom-fittings',
        title: 'Фурнитура',
        audience: 'both',
        children: [
          createLinkItem({
            id: 'customer-custom-nuomi',
            title: 'Nuomi',
            url: 'https://nuomishop.ru/',
          }),
        ],
      }),
      createRequestItem({
        id: 'customer-custom-calculation-request',
        title: 'Сделать запрос на расчет',
        audience: 'customer',
        form: 'customer_request',
        description: 'Открывает форму заявки для расчета мебели на заказ.',
      }),
    ],
  }),
  createSubmenuItem({
    id: 'customer-wall-panels',
    title: 'Стеновые панели',
    audience: 'both',
    description: 'PDF-каталоги стеновых панелей и декоративных материалов.',
    children: [
      createPdfItem({
        id: 'customer-wall-flexible-ceramic',
        title: 'Гибкая керамика',
        telegramFileId:
          'BQACAgIAAxkBAAIB9Wn0u4bR1zwPestnmXdrw_VAF8Y1AALTlQAC27CpS8C6ZAZiHiM1OwQ',
      }),
      createPdfItem({
        id: 'customer-wall-decorative-panel',
        title: 'Декоративная панель',
        telegramFileId:
          'BQACAgIAAxkBAAIB92n0u4d9UNLMeDqS4uvq2rQ47nZ6AALUlQAC27CpS78H5hAzufK-OwQ',
      }),
      createPdfItem({
        id: 'customer-wall-metal-panels',
        title: 'Металлические панели',
        telegramFileId:
          'BQACAgIAAxkBAAIB-Wn0u4i_DjwsEay7_TWWJ5LQPje3AALVlQAC27CpS-jGqDfAo0XZOwQ',
      }),
      createPdfItem({
        id: 'customer-wall-foam-ceramic',
        title: 'Пенокерамика',
        telegramFileId:
          'BQACAgIAAxkBAAICA2n0vAWN-YYD9BaVatnS45vFmOiDAALblQAC27CpS9wPHb9ffxofOwQ',
      }),
      createPdfItem({
        id: 'customer-wall-glass-brick',
        title: 'Стеклянный кирпич',
        telegramFileId:
          'BQACAgIAAxkBAAIB-2n0u4lnabAsg5lDVAgl5qfthQ4KAALWlQAC27CpSw_cdAH5q6fwOwQ',
      }),
      createPdfItem({
        id: 'customer-wall-wpc-ribbed-panels',
        title: 'WPC рифленые панели',
        telegramFileId:
          'BQACAgIAAxkBAAICAWn0u6ZK8fxYp6sgRXmjesojFeujAALZlQAC27CpS9zs5_zlf2QIOwQ',
      }),
      createPdfItem({
        id: 'customer-wall-bamboo-panels',
        title: 'Стеновые панели бамбук',
        telegramFileId:
          'BQACAgIAAxkBAAIB_2n0u592-MCzjaIv5vaM_4WSqDtyAALYlQAC27CpS3FrjJhduB2ZOwQ',
      }),
    ],
  }),
  createSubmenuItem({
    id: 'customer-appliances',
    title: 'Бытовая техника',
    audience: 'both',
    description: 'Ссылки на сайты поставщиков бытовой техники.',
    children: [
      createLinkItem({
        id: 'customer-appliances-asko',
        title: 'ASKO',
        url: 'https://asko-russia.ru/',
      }),
      createLinkItem({
        id: 'customer-appliances-korting',
        title: 'Korting',
        url: 'https://korting.ru/?ysclid=mnwrfh7mju265834246',
      }),
      createLinkItem({
        id: 'customer-appliances-lex',
        title: 'LEX',
        url: 'https://lex1.ru/',
      }),
      createLinkItem({
        id: 'customer-appliances-maunfeld',
        title: 'Maunfeld',
        url: 'https://www.maunfeld.ru/?ysclid=mnwrfwvf7n463732712',
      }),
      createLinkItem({
        id: 'customer-appliances-evelux',
        title: 'Evelux',
        url: 'https://evelux.ru/?ysclid=mnwrg7g19y268607152',
      }),
      createLinkItem({
        id: 'customer-appliances-kuppersbusch',
        title: 'Kuppersbusch',
        url: 'https://kuppersbusch-shop.ru/?ysclid=mnwrgiagw9306363873',
      }),
      createLinkItem({
        id: 'customer-appliances-sm-rus',
        title: 'SM Rus',
        url: 'https://sm-rus.ru/',
      }),
    ],
  }),
]);

module.exports = {
  CATALOGS,
};
