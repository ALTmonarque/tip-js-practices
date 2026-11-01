const PRIORITIES = ["low", "medium", "high"];

function checkId(id) {
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return "id должен быть положительным безопасным целым числом";
  }
  return null;
}

function normalizeTitle(title) {
  if (typeof title !== "string") {
    return { error: "Название должно быть строкой" };
  }
  const clean = title.trim();
  if (clean.length === 0) {
    return { error: "Название не должно быть пустым" };
  }
  if (clean.length > 100) {
    return { error: "Название не должно быть длиннее 100 символов" };
  }
  return { title: clean };
}

function checkPriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    return "Приоритет должен быть одним из: low, medium, high";
  }
  return null;
}

export function createTask(id, title, priority = "medium") {
  const idError = checkId(id);
  if (idError) return { ok: false, error: idError };

  const normalized = normalizeTitle(title);
  if (normalized.error) return { ok: false, error: normalized.error };

  const priorityError = checkPriority(priority);
  if (priorityError) return { ok: false, error: priorityError };

  return {
    ok: true,
    task: { id, title: normalized.title, completed: false, priority },
  };
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
  let completed = 0;

  for (const task of tasks) {
    if (task.completed === true) {
      completed += 1;
    }
  }

  const pending = total - completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) return created;

  if (tasks.some((task) => task.id === id)) {
    return { ok: false, error: `Задача с id ${id} уже существует` };
  }

  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const idError = checkId(id);
  if (idError) return { ok: false, error: idError };

  if (typeof completed !== "boolean") {
    return { ok: false, error: "Статус должен быть true или false" };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  return {
    ok: true,
    tasks: tasks.map((task) =>
      task.id === id ? { ...task, completed } : task
    ),
  };
}

export function renameTask(tasks, id, title) {
  const idError = checkId(id);
  if (idError) return { ok: false, error: idError };

  const normalized = normalizeTitle(title);
  if (normalized.error) return { ok: false, error: normalized.error };

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  return {
    ok: true,
    tasks: tasks.map((task) =>
      task.id === id ? { ...task, title: normalized.title } : task
    ),
  };
}

export function removeTask(tasks, id) {
  const idError = checkId(id);
  if (idError) return { ok: false, error: idError };

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}