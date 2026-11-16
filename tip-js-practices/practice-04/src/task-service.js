// Операции над списком задач. DOM, localStorage и внешнее состояние здесь не используются.
// Для предусмотренных ошибок возвращается { ok: false, error: "..." }.

const PRIORITIES = ["low", "medium", "high"];

function isValidId(id) {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0;
}

function normalizeTitle(title) {
  if (typeof title !== "string") return null;
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= 100 ? trimmed : null;
}

function isValidPriority(priority) {
  return typeof priority === "string" && PRIORITIES.includes(priority);
}

function fail(error) {
  return { ok: false, error };
}

export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) return fail("id должен быть положительным безопасным целым числом.");
  const normalized = normalizeTitle(title);
  if (normalized === null) return fail("Название должно быть строкой длиной от 1 до 100 символов.");
  if (!isValidPriority(priority)) return fail("Приоритет должен быть low, medium или high.");
  return { ok: true, task: { id, title: normalized, completed: false, priority } };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  const progress = total === 0 ? 0 : (completed / total) * 100;
  return { total, completed, pending: total - completed, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) return created;
  if (findTaskById(tasks, id) !== undefined) return fail(`Задача с id ${id} уже существует.`);
  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) return fail("id должен быть положительным безопасным целым числом.");
  if (typeof completed !== "boolean") return fail("Статус должен быть значением true или false.");
  if (findTaskById(tasks, id) === undefined) return fail(`Задача с id ${id} не найдена.`);
  return { ok: true, tasks: tasks.map((task) => (task.id === id ? { ...task, completed } : task)) };
}

export function renameTask(tasks, id, title) {
  if (!isValidId(id)) return fail("id должен быть положительным безопасным целым числом.");
  const normalized = normalizeTitle(title);
  if (normalized === null) return fail("Название должно быть строкой длиной от 1 до 100 символов.");
  if (findTaskById(tasks, id) === undefined) return fail(`Задача с id ${id} не найдена.`);
  return { ok: true, tasks: tasks.map((task) => (task.id === id ? { ...task, title: normalized } : task)) };
}

export function removeTask(tasks, id) {
  if (!isValidId(id)) return fail("id должен быть положительным безопасным целым числом.");
  if (findTaskById(tasks, id) === undefined) return fail(`Задача с id ${id} не найдена.`);
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}

// ПР4: меняются только title и priority; id и completed сохраняются.
export function updateTask(tasks, id, title, priority) {
  if (!isValidId(id)) return fail("id должен быть положительным безопасным целым числом.");
  if (findTaskById(tasks, id) === undefined) return fail(`Задача с id ${id} не найдена.`);
  // createTask используется только как проверка полей: его completed: false не применяется.
  const checked = createTask(id, title, priority);
  if (!checked.ok) return checked;
  const { title: newTitle, priority: newPriority } = checked.task;
  return {
    ok: true,
    tasks: tasks.map((task) => (task.id === id ? { ...task, title: newTitle, priority: newPriority } : task)),
  };
}
