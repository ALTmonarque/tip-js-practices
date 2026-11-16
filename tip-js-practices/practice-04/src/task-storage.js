export const STORAGE_VERSION = 1;

const PRIORITIES = new Set(["low", "medium", "high"]);

// Все функции принимают объект storage явно, чтобы их можно было проверить
// без обращения к глобальному window.localStorage.

function isValidTask(task) {
  return (
    task !== null &&
    typeof task === "object" &&
    typeof task.id === "number" &&
    Number.isSafeInteger(task.id) &&
    task.id > 0 &&
    typeof task.title === "string" &&
    task.title.trim().length >= 1 &&
    task.title.trim().length <= 100 &&
    typeof task.completed === "boolean" &&
    typeof task.priority === "string" &&
    PRIORITIES.has(task.priority)
  );
}

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  if (!value.every(isValidTask)) return false;
  return new Set(value.map((task) => task.id)).size === value.length;
}

function copyTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = (error) => ({ ok: false, source: "fallback", tasks: copyTasks(fallbackTasks), error });

  let raw;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    return fallback(`Не удалось прочитать localStorage: ${error.message}`);
  }
  if (raw === null) return { ok: true, source: "initial", tasks: copyTasks(fallbackTasks) };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback("Сохранённые данные повреждены (некорректный JSON). Используется исходный набор.");
  }
  if (parsed === null || typeof parsed !== "object" || parsed.version !== STORAGE_VERSION) {
    return fallback("Неизвестная версия сохранённых данных. Используется исходный набор.");
  }
  if (!isValidTaskList(parsed.tasks)) {
    return fallback("Сохранённые задачи не соответствуют схеме. Используется исходный набор.");
  }
  return { ok: true, source: "storage", tasks: copyTasks(parsed.tasks) };
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Список задач некорректен и не был сохранён." };
  }
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить данные в localStorage: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить сохранённые данные: ${error.message}` };
  }
}
