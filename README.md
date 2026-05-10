# Ilina Furniture Telegram Bot

Коммерческий каркас Telegram-бота для мебельной компании на `Node.js + Telegraf`.

## Что уже есть

- выбор роли: заказчик / дизайнер
- отдельные меню для каждой роли
- FAQ, прайс, адрес и график работы
- многоуровневые каталоги
- раздел 3D моделей для дизайнеров
- форма заявки заказчика
- форма записи на консультацию
- анкета нового дизайнера
- запрос дизайнера под проект
- отправка лидов в Telegram-группу
- best-effort запись в Google Sheets по разным листам

## Структура

```text
.
|-- assets/
|   |-- catalogs/
|   |-- models/
|   `-- pdf/
|-- src/
|   |-- bot.js
|   |-- index.js
|   |-- config/
|   |-- constants/
|   |-- handlers/
|   |-- keyboards/
|   |-- scenes/
|   |   `-- helpers/
|   |-- services/
|   `-- utils/
|-- .env.example
|-- package.json
`-- README.md
```

## Запуск

```bash
npm install
npm run dev
```

или

```bash
npm start
```

## ENV

Обязательное:

- `BOT_TOKEN`

Для Telegram-группы:

- `GROUP_CHAT_ID`

Для Google Sheets:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_CLIENT_EMAIL`
- `GOOGLE_SHEETS_PRIVATE_KEY`
- `GOOGLE_SHEETS_CUSTOMER_REQUESTS_SHEET`
- `GOOGLE_SHEETS_CONSULTATIONS_SHEET`
- `GOOGLE_SHEETS_DESIGNERS_SHEET`
- `GOOGLE_SHEETS_DESIGNER_PROJECTS_SHEET`

Если `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_CLIENT_EMAIL` или `GOOGLE_SHEETS_PRIVATE_KEY` не заполнены, бот все равно стартует, но в логах появится предупреждение:

- `Google Sheets integration disabled because env is incomplete.`

## Архитектура

- `config/` хранит данные предметной области: FAQ, прайс, каталоги, 3D-материалы, менеджеров, адрес.
- `constants/` хранит тексты, кнопки, роли и идентификаторы сцен.
- `handlers/` отвечают за маршрутизацию по кнопкам и команде `/start`.
- `services/` содержат бизнес-логику, доставку лидов, Google Sheets и работу с файлами.
- `scenes/` содержат пошаговые формы. Повторяющаяся логика вынесена в фабрику `create-lead-form.scene.js`.
- `keyboards/` изолируют все reply-клавиатуры, включая ролевые меню и служебные действия.

## Google Sheets Setup

Нужно создать одну таблицу Google Sheets и 4 листа внутри нее.

Также нужно открыть доступ к этой таблице для `GOOGLE_SHEETS_CLIENT_EMAIL` от service account, иначе API не сможет добавлять строки.

Названия листов:

- `customer_requests`
- `consultations`
- `designers`
- `designer_projects`

### Лист `customer_requests`

Заголовки колонок:

- `created_at`
- `type`
- `name`
- `phone`
- `city`
- `request_text`
- `telegram_username`
- `telegram_user_id`

### Лист `consultations`

Заголовки колонок:

- `created_at`
- `type`
- `role`
- `name`
- `phone`
- `city`
- `manager`
- `preferred_time`
- `telegram_username`
- `telegram_user_id`

### Лист `designers`

Заголовки колонок:

- `created_at`
- `type`
- `full_name`
- `contacts`
- `certificate_info`
- `telegram_username`
- `telegram_user_id`

### Лист `designer_projects`

Заголовки колонок:

- `created_at`
- `type`
- `full_name`
- `phone`
- `city`
- `project_description`
- `comment`
- `telegram_username`
- `telegram_user_id`

## Assets

- каталоги складываются в `assets/catalogs`
- 3D-материалы складываются в `assets/models`
- прайс и другие PDF общего назначения складываются в `assets/pdf`

Если какого-то файла нет, бот не падает и показывает корректную заглушку с дальнейшим действием.
