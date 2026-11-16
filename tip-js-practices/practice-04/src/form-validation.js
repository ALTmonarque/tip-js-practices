const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Читает id из поля формы: число или строка из цифр. Иначе возвращает null.
function parseId(raw) {
  if (typeof raw === "number") {
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!/^[1-9]\d*$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id = null;

  if (editingId === null) {
    id = parseId(draft.id);
    if (id === null) {
      errors.id = "Введите положительное целое число.";
    } else if (tasks.some((task) => task.id === id)) {
      errors.id = `Задача с id ${id} уже существует.`;
    }
  } else {
    id = editingId;
    if (!tasks.some((task) => task.id === editingId)) {
      errors.id = `Редактируемая задача с id ${editingId} не найдена.`;
    }
  }

  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  if (title.length < 1 || title.length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов после удаления пробелов по краям.";
  }

  if (typeof draft.priority !== "string" || !ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { id, title, priority: draft.priority } };
}
