import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
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

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>

// Проверяет и нормализует фильтры ДО запроса. Лишние ключи не пропускаются.
function normalizeFilters(filters) {
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("filters должен быть объектом.");
  }
  const query = {};
  for (const name of Object.keys(filters)) {
    if (!ALLOWED_FILTERS.has(name)) throw new TypeError(`Неизвестный фильтр: ${name}.`);
  }
  if (filters.completed !== undefined) {
    if (typeof filters.completed !== "boolean") throw new TypeError("completed должен быть boolean.");
    query.completed = filters.completed; // false сохраняется как boolean
  }
  if (filters.priority !== undefined) {
    if (!ALLOWED_PRIORITIES.has(filters.priority)) {
      throw new TypeError("priority должен быть low, medium или high.");
    }
    query.priority = filters.priority;
  }
  if (filters.categoryId !== undefined) {
    if (!isPositiveSafeInteger(filters.categoryId)) {
      throw new TypeError("categoryId должен быть положительным целым числом.");
    }
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

function hasUniqueIds(items) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

export function createTaskApi(client) {
  if (client === null || typeof client !== "object" || typeof client.requestJson !== "function") {
    throw new TypeError("client должен содержать метод requestJson.");
  }

  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query });
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

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("id должен быть положительным целым числом.");
    const payload = await client.requestJson(`/tasks/${id}`);
    if (payload === null || typeof payload !== "object" || !isTask(payload.data)) {
      throw invalidResponse("Ответ /tasks/:id содержит задачу неверной формы.");
    }
    return payload.data;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");
    if (payload === null || typeof payload !== "object" || !Array.isArray(payload.data)
        || !payload.data.every(isCategory) || !hasUniqueIds(payload.data)) {
      throw invalidResponse("Ответ /categories содержит категории неверной формы.");
    }
    return payload.data;
  }

  // Оба запроса начинаются до общего await: независимые запросы идут параллельно.
  async function loadInitialData(filters = {}) {
    const [{ tasks, meta }, categories] = await Promise.all([getTasks(filters), getCategories()]);
    return { tasks, categories, meta };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}
