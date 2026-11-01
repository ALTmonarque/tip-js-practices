import { getTaskStats } from "./task-service.js";

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Контракт карточки, селекторы и тексты описаны в методичке.

const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

// Вспомогательная функция: кнопка с вложенной подписью span.action-label
function createActionButton(action, labelText) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;

  const label = document.createElement("span");
  label.classList.add("action-label");
  label.textContent = labelText;

  button.append(label);
  return button;
}

export function createTaskElement(task) {
  const card = document.createElement("li");
  card.classList.add("task-card");
  card.dataset.taskId = String(task.id);
  card.classList.toggle("is-completed", task.completed);

  const title = document.createElement("h3");
  title.classList.add("task-title");
  title.textContent = task.title; // текст, а не HTML

  const status = document.createElement("span");
  status.classList.add("task-status");
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("span");
  priority.classList.add("task-priority");
  priority.textContent = PRIORITY_LABELS[task.priority];

  const actions = document.createElement("div");
  actions.classList.add("task-actions");

  const toggleButton = createActionButton("toggle", "Выполнена");
  toggleButton.setAttribute("aria-pressed", String(task.completed));

  const deleteButton = createActionButton("delete", "Удалить");

  actions.append(toggleButton, deleteButton);
  card.append(title, status, priority, actions);

  return card;
}

export function renderTaskList(listElement, tasks) {
  const cards = tasks.map((task) => createTaskElement(task));
  listElement.replaceChildren(...cards);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  const { total, completed, pending, progress } = getTaskStats(tasks);

  const values = {
    total: String(total),
    completed: String(completed),
    pending: String(pending),
    progress: `${progress.toFixed(1)}%`,
    visible: String(visibleCount),
  };

  for (const [name, value] of Object.entries(values)) {
    const node = summaryElement.querySelector(`[data-stat="${name}"]`);
    if (node) {
      node.textContent = value;
    }
  }
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (visibleCount > 0) {
    messageElement.textContent = "";
    messageElement.hidden = true;
    return;
  }

  messageElement.textContent =
    total === 0 ? "Список задач пуст." : "Нет задач по выбранному фильтру.";
  messageElement.hidden = false;
}
