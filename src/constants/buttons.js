const ROLE_BUTTONS = Object.freeze({
  CUSTOMER: 'Я заказчик',
  DESIGNER: 'Я дизайнер',
});

const COMMON_BUTTONS = Object.freeze({
  BACK_TO_MENU: 'Назад в меню',
  CHANGE_ROLE: 'Сменить роль',
});

const CATALOG_NAVIGATION_BUTTONS = Object.freeze({
  BACK: 'Назад',
  CATALOG: 'В каталог',
  MENU: 'В меню',
});

const FORM_BUTTONS = Object.freeze({
  CONSENT: 'Согласен',
  CANCEL: 'Отменить',
  CONFIRM: 'Подтвердить отправку',
  SKIP: 'Пропустить',
  SEND_PHONE: '📱 Отправить номер',
});

const CUSTOMER_MENU_BUTTONS = Object.freeze({
  FAQ: 'Частые вопросы',
  CATALOGS: 'Каталоги',
  PRICE: 'Прайс',
  LOCATION: 'Как нас найти',
  MANAGERS: 'Менеджеры',
  REQUEST: 'Сделать запрос',
  CONSULTATION: 'Записаться на консультацию',
});

const DESIGNER_MENU_BUTTONS = Object.freeze({
  CATALOGS: 'Каталоги',
  MODELS_3D: '3D модели',
  COOPERATION: 'Уточнить условия сотрудничества',
  PROJECT_REQUEST: 'Сделать запрос под проект',
  CONSULTATION: 'Записаться на консультацию',
  LOCATION: 'Как нас найти',
});

const DESIGNER_ACTION_BUTTONS = Object.freeze({
  START_COOPERATION_FORM: 'Заполнить анкету дизайнера',
  REQUEST_3D_MODEL: 'Запросить 3D модель',
});

module.exports = {
  ROLE_BUTTONS,
  COMMON_BUTTONS,
  CATALOG_NAVIGATION_BUTTONS,
  FORM_BUTTONS,
  CUSTOMER_MENU_BUTTONS,
  DESIGNER_MENU_BUTTONS,
  DESIGNER_ACTION_BUTTONS,
};
