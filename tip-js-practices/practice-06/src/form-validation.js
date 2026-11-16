const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const errors = {};

  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  if (title.length < 1 || title.length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов после удаления пробелов по краям.";
  }

  const priority = draft?.priority;
  if (typeof priority !== "string" || !ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий.";
  }

  // Значение select приходит строкой, поэтому преобразуем его явно и проверяем по списку категорий.
  const rawCategory = typeof draft?.categoryId === "string" ? draft.categoryId.trim() : draft?.categoryId;
  const categoryId = typeof rawCategory === "number"
    ? rawCategory
    : (typeof rawCategory === "string" && /^[1-9]\d*$/.test(rawCategory) ? Number(rawCategory) : null);
  const exists = Number.isSafeInteger(categoryId)
    && categories.some((category) => category.id === categoryId);
  if (!exists) errors.categoryId = "Выберите существующую категорию.";

  if (Object.keys(errors).length > 0) return { valid: false, value: null, errors };
  return { valid: true, value: { title, priority, categoryId }, errors: {} };
}
