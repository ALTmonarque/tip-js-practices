# Практическая работа № 6. Браузерное приложение и учебный API

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

Рабочая папка: `practice-06`. Одна команда запускает API и веб-сервер.

```bash
npm start        # API: http://127.0.0.1:5505/api, приложение: http://127.0.0.1:5506/
npm test         # check:api + check:modules + check:integration
```

```text
http://127.0.0.1:5506/
http://127.0.0.1:5506/?dataset=variant
http://127.0.0.1:5506/checks.html
```

## Что реализовано

| Файл | Что сделано |
|---|---|
| `src/api-client.js` | Клиент ПР5, расширенный методами GET/POST/PATCH/DELETE: `body` сериализуется в JSON, `Content-Type` добавляется только при наличии тела, у GET тела быть не может; `204 -> null`. |
| `src/task-api.js` | Методы `getTasks`, `getTaskById`, `getCategories`, `loadInitialData`, `createTask` (POST), `updateTask` и `setTaskCompleted` (PATCH), `deleteTask` (DELETE, ждёт 204), `resetDemoData`. Все ответы проверяются по схеме. |
| `src/form-validation.js` | `validateTaskDraft(draft, categories)`: название, приоритет, существующая категория. |
| `src/app-controller.js` | Состояние (`tasks`, `categories`, `filters`, `editingId`), `loading/ready/empty/error`, отмена предыдущей загрузки через `AbortController`, игнорирование устаревших ответов, повторный запрос списка после мутаций, блокировка действий на время мутации. |
| `src/task-view.js` | Карточка с названием, статусом, приоритетом, категорией и тремя действиями; текст только через `textContent`. |
| `src/variant.js` | `variantNumber = 5` (фильтр `categoryId: 1`). |

## Результаты проверок

| Проверка | Результат |
|---|---|
| `npm run check:api` | 23 / 23 |
| `npm run check:modules` | 33 / 33 |
| `npm run check:integration` | 14 / 14 |
| `checks.html` (Chromium) | 13 / 14 с неизменённым файлом проверок. Единственный отказ: «Корректная форма создаёт задачу с серверным id». В проверке `waitFor(() => requireNode(...))` вызывает `requireNode` внутри условия, и он бросает исключение при первом же вызове, до завершения асинхронного POST. Приложение работает корректно: карточка с id 35 появляется примерно через 100 мс, форма очищается, всего 13 задач. На копии, где условие заменено на `doc.querySelector(...)`, проходят 14 / 14. |

## Проверка «изменение статуса через API»

Сброс данных, фильтр `completed=false`, отметка задачи `id = 4`. В Network: `PATCH /api/tasks/4 -> 200`, затем `GET /api/tasks?completed=false -> 200`; задача 4 исчезла из выборки.

## Индивидуальный вариант 5

Фильтр `categoryId: 1` на странице `?dataset=variant` отбирает задачи id `[1, 7, 13]`.

`[ВСТАВИТЬ: скриншоты приложения, Network и отчёт по отладке]`
