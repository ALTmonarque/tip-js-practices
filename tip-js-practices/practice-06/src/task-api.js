import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных — { signal }.

// Проверяет и нормализует фильтры ДО запроса. Лишние ключи не пропускаются.
function normalizeFilters(filters) {
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("filters должен быть объектом.");
  }
  for (const name of Object.keys(filters)) {
    if (!ALLOWED_FILTERS.has(name)) throw new TypeError(`Неизвестный фильтр: ${name}.`);
  }
  const query = {};
  if (filters.completed !== undefined) {
    if (typeof filters.completed !== "boolean") throw new TypeError("completed должен быть boolean.");
    query.completed = filters.completed;
  }
  if (filters.priority !== undefined) {
    if (!ALLOWED_PRIORITIES.has(filters.priority)) throw new TypeError("priority должен быть low, medium или high.");
    query.priority = filters.priority;
  }
  if (filters.categoryId !== undefined) {
    if (!isPositiveSafeInteger(filters.categoryId)) throw new TypeError("categoryId должен быть положительным целым числом.");
    query.categoryId = filters.categoryId;
  }
  if (filters.q !== undefined) {
    if (typeof filters.q !== "string") throw new TypeError("q должен быть строкой.");
    const q = filters.q.trim();
    if (q.length > 100) throw new TypeError("q не должен быть длиннее 100 символов.");
    if (q !== "") query.q = q;
  }
  return query;
}

const ALLOWED_CHANGES = new Set(["title", "completed", "priority", "categoryId"]);

function checkId(id) {
  if (!isPositiveSafeInteger(id)) throw new TypeError("id должен быть положительным целым числом.");
}

function hasUniqueIds(items) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

export function createTaskApi(client) {
  if (client === null || typeof client !== "object" || typeof client.requestJson !== "function") {
    throw new TypeError("client должен содержать метод requestJson.");
  }

  const readTask = (payload, where) => {
    if (payload === null || typeof payload !== "object" || !isTask(payload.data)) {
      throw invalidResponse(`Ответ ${where} содержит задачу неверной формы.`);
    }
    return payload.data;
  };

  async function getTasks(filters = {}, { signal } = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query, signal });
    if (payload === null || typeof payload !== "object" || !Array.isArray(payload.data)) {
      throw invalidResponse("Ответ /tasks должен содержать массив data.");
    }
    if (!payload.data.every(isTask)) throw invalidResponse("Ответ /tasks содержит задачу неверной формы.");
    if (!hasUniqueIds(payload.data)) throw invalidResponse("Ответ /tasks содержит повторяющиеся id.");
    if (payload.meta === null || typeof payload.meta !== "object" || payload.meta.total !== payload.data.length) {
      throw invalidResponse("meta.total не совпадает с количеством полученных задач.");
    }
    return { tasks: payload.data, meta: payload.meta };
  }

  async function getTaskById(id, { signal } = {}) {
    checkId(id);
    return readTask(await client.requestJson(`/tasks/${id}`, { signal }), "/tasks/:id");
  }

  async function getCategories({ signal } = {}) {
    const payload = await client.requestJson("/categories", { signal });
    if (payload === null || typeof payload !== "object" || !Array.isArray(payload.data)
        || !payload.data.every(isCategory) || !hasUniqueIds(payload.data)) {
      throw invalidResponse("Ответ /categories содержит категории неверной формы.");
    }
    return payload.data;
  }

  // Оба запроса начинаются до общего await: независимые запросы идут параллельно.
  async function loadInitialData(filters = {}, { signal } = {}) {
    const [{ tasks, meta }, categories] = await Promise.all([
      getTasks(filters, { signal }),
      getCategories({ signal }),
    ]);
    return { tasks, categories, meta };
  }

  // Значения полей проверяет сервер: клиент отправляет их как есть и показывает его ответ
  // (ошибка VALIDATION_ERROR доступна вызывающему коду через ApiError.details).
  async function createTask(draft, { signal } = {}) {
    if (draft === null || typeof draft !== "object" || Array.isArray(draft)) {
      throw new TypeError("draft должен быть объектом.");
    }
    const body = { title: draft.title, priority: draft.priority, categoryId: draft.categoryId };
    return readTask(await client.requestJson("/tasks", { method: "POST", body, signal }), "POST /tasks");
  }

  async function updateTask(id, changes, { signal } = {}) {
    checkId(id);
    if (changes === null || typeof changes !== "object" || Array.isArray(changes)) {
      throw new TypeError("changes должен быть объектом.");
    }
    const body = {};
    for (const name of Object.keys(changes)) {
      if (!ALLOWED_CHANGES.has(name)) throw new TypeError(`Неизвестное поле: ${name}.`);
      body[name] = changes[name];
    }
    if (Object.keys(body).length === 0) throw new TypeError("Нужно передать хотя бы одно изменяемое поле.");
    return readTask(await client.requestJson(`/tasks/${id}`, { method: "PATCH", body, signal }), "PATCH /tasks/:id");
  }

  async function setTaskCompleted(id, value, { signal } = {}) {
    if (typeof value !== "boolean") throw new TypeError("completed должен быть boolean.");
    return updateTask(id, { completed: value }, { signal });
  }

  async function deleteTask(id, { signal } = {}) {
    checkId(id);
    const result = await client.requestJson(`/tasks/${id}`, { method: "DELETE", signal });
    if (result !== null) throw invalidResponse("DELETE должен вернуть пустой ответ 204.");
    return null;
  }

  async function resetDemoData({ signal } = {}) {
    const payload = await client.requestJson("/debug/reset", { method: "POST", signal });
    const data = payload?.data;
    if (data === null || typeof data !== "object" || data.reset !== true || !Number.isSafeInteger(data.total)) {
      throw invalidResponse("Ответ /debug/reset имеет неверную форму.");
    }
    return data;
  }

  return {
    getTasks, getTaskById, getCategories, loadInitialData,
    createTask, updateTask, setTaskCompleted, deleteTask, resetDemoData,
  };
}
