const FIRST_AVAILABLE_MANAGER_OPTION = Object.freeze({
  id: 'first_available',
  name: 'Первый свободный',
});

const MANAGERS = Object.freeze([
  Object.freeze({
    id: 'filippova_natalya',
    name: 'Филиппова Наталья',
    phone: '+7 919 616 3387',
    email: 'natalia.tehnoidea@mail.ru',
    username: '',
    description: 'менеджер по корпусной мебели на заказ',
  }),
  Object.freeze({
    id: 'martyanova_diana',
    name: 'Мартьянова Диана',
    phone: '+7 996 103 1951',
    email: '2908698@mail.ru',
    username: '',
    description: 'менеджер по технике и стеновым панелям',
  }),
  Object.freeze({
    id: 'akhmatdinova_galiya',
    name: 'Ахматдинова Галия',
    phone: '+7 917 346 2206',
    email: 'tehnoidea@inbox.ru',
    username: '',
    description: 'менеджер по корпусной мебели на заказ',
  }),
  Object.freeze({
    id: 'akhmetzyanova_ilina',
    name: 'Ахметзянова Илина',
    phone: '+7 987 133 7415',
    email: 'infoenzahome@mail.ru',
    username: '',
    description: 'менеджер по интерьерным решениям (мягкая мебель, корпусная, обеденные группы, декор)',
  }),
  Object.freeze({
    id: 'shamsieva_rita_rimovna',
    name: 'Шамсиева Рита Римовна',
    phone: '89961071053',
    email: 'rita.shamsieva@mail.ru',
    username: '',
    description: 'универсальный менеджер (корпусная мебель, мягкая мебель)',
  }),
]);

module.exports = {
  MANAGERS,
  FIRST_AVAILABLE_MANAGER_OPTION,
};
