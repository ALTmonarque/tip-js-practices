# Практическая работа № 5. Асинхронность, HTTP и клиент API

## Данные работы

| Поле | Значение |
|---|---|
| Имя | Рассолов Максим |
| Группа | ЭФБО-14-25 |
| Номер по списку / вариант | 21 / 5 (тема «Разработка командного прототипа») |
| Node.js | `[ВСТАВИТЬ: node --version]` |
| Браузер | `[ВСТАВИТЬ: название и версия]` |
| Операционная система | `[ВСТАВИТЬ]` |

## Запуск

Два терминала, рабочая папка `practice-05`:

```bash
npm start          # учебный API: http://127.0.0.1:5505/api
npm run client     # консольный сценарий клиента
npm test           # check:api + check:client + check:integration (API должен быть запущен для интеграционных проверок)
```

## Что реализовано

| Файл | Что сделано |
|---|---|
| `src/api-client.js` | `buildUrl` (URL и `URLSearchParams`, сохраняются `false` и `0`, пропускаются `undefined`/`null`/`""`) и `createApiClient` с `requestJson`: GET с `Accept`, тайм-аут + внешний `AbortSignal`, проверка `response.ok` до разбора JSON, `204 -> null`, проверка `Content-Type`, виды `ApiError`: `http`, `network`, `timeout`, `aborted`, `invalid-response`. |
| `src/task-api.js` | `createTaskApi`: нормализация и проверка фильтров до запроса, `getTasks`, `getTaskById`, `getCategories`, `loadInitialData` (два запроса стартуют параллельно через `Promise.all`), проверка схемы задач и категорий, уникальности id и `meta.total`. |
| `src/variant.js` | Вариант 5: `variantFilters = { categoryId: 1 }`. |

## Результаты проверок

| Проверка | Результат |
|---|---|
| `npm run check:api` | 18 / 18 |
| `npm run check:client` | 26 / 26 |
| `npm run check:integration` | 13 / 13 |

## Контрольные сценарии

Общий запрос `{ completed: false, priority: "high" }`: id `[4, 13, 34]`, `meta.total = 3`.

Ошибка `getTaskById(999)`: `kind: "http"`, `status: 404`, `code: "TASK_NOT_FOUND"`; неперехваченного исключения нет.

## Индивидуальный вариант 5

| Параметр | Значение |
|---|---|
| Фильтры | `{ categoryId: 1 }` |
| Сформированный URL | `http://127.0.0.1:5505/api/tasks?categoryId=1` |
| Полученные id | `[1, 7, 13]` (совпадают с методичкой) |
| `meta.total` | 3 |

Фильтр `categoryId=1` передаётся серверу как query-параметр и отбирает задачи категории «Учёба». Остальные фильтры в запрос не попадают.

## Задания, которые нужно выполнить и записать самостоятельно

- Задание 2: прогноз порядка меток A–F до запуска `npm run example:order`, затем фактический вывод и объяснение.
- Задание 3: таблица статусов, `Content-Type` и формы тела для шести запросов из методички (`/api/health`, `/api/tasks`, …, `/api/tasks/999`, `/api/categories`) и вывод `npm run example:fetch`.
- Задание 7: замеры последовательной загрузки и `Promise.all` (минимум по три раза).
- Остановка API и повторный `npm run client` — ошибка `network`.

`[ВСТАВИТЬ: результаты и скриншоты по пунктам выше]`
