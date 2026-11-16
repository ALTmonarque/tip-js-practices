const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

function createActionButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  const span = document.createElement("span");
  span.className = "action-label";
  span.textContent = label;
  button.append(span);
  return button;
}

// Пользовательские данные добавляются только через textContent.
export function createTaskElement(task, category) {
  const item = document.createElement("li");
  item.className = "task-card";
  item.dataset.taskId = String(task.id);
  if (task.completed) item.classList.add("is-completed");

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;

  const categoryNode = document.createElement("span");
  categoryNode.className = "task-category";
  categoryNode.textContent = category ? category.name : "Без категории";

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const toggle = createActionButton("toggle", "Выполнена");
  toggle.setAttribute("aria-pressed", String(task.completed));
  actions.append(toggle, createActionButton("edit", "Изменить"), createActionButton("delete", "Удалить"));

  item.append(title, status, priority, categoryNode, actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  const names = new Map(categories.map((category) => [category.id, category]));
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, names.get(task.categoryId))));
}
