import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  const apiMethods = [
    "loadInitialData", "getTasks", "createTask", "updateTask",
    "setTaskCompleted", "deleteTask", "resetDemoData",
  ];
  const viewMethods = [
    "setListState", "setTasks", "setCategories", "setTotal",
    "setFormTask", "showFormErrors", "setMutationPending", "notify",
  ];
  if (!api || apiMethods.some((name) => typeof api[name] !== "function")) {
    throw new TypeError("api должен содержать методы доменного API.");
  }
  if (!view || viewMethods.some((name) => typeof view[name] !== "function")) {
    throw new TypeError("view должен содержать методы интерфейса.");
  }
  if (typeof validateDraft !== "function") {
    throw new TypeError("validateDraft должен быть функцией.");
  }

  let tasks = [];
  let categories = null; // null: категории ещё не получены
  let filters = {};
  let editingId = null;
  let activeController = null;
  let requestNumber = 0;
  let destroyed = false;

  // Загрузка списка. Новая загрузка отменяет предыдущую, устаревший ответ игнорируется.
  async function load(nextFilters = filters) {
    filters = { ...nextFilters };
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    requestNumber += 1;
    const myNumber = requestNumber;
    const isCurrent = () => !destroyed && myNumber === requestNumber;

    view.setListState("loading");
    try {
      let result;
      if (categories === null) {
        // Категории ещё не получены: выполняется начальная загрузка целиком.
        result = await api.loadInitialData(filters, { signal: controller.signal });
      } else {
        const loaded = await api.getTasks(filters, { signal: controller.signal });
        result = { tasks: loaded.tasks, categories, meta: loaded.meta };
      }
      if (!isCurrent()) return;
      categories = result.categories;
      tasks = result.tasks;
      view.setCategories(categories);
      view.setTasks(tasks, categories);
      view.setTotal(result.meta.total);
      view.setListState(tasks.length === 0 ? "empty" : "ready");
    } catch (error) {
      if (!isCurrent()) return;
      if (error instanceof ApiError && error.kind === "aborted") return;
      view.setListState("error", messageForError(error));
    }
  }

  // Общая обёртка мутации: блокировка действий, показ результата, обновление списка.
  async function mutate(operation, successMessage) {
    view.setMutationPending(true);
    try {
      await operation();
      view.notify(successMessage, "success");
      await load(filters);
      return true;
    } catch (error) {
      view.notify(messageForError(error), "error");
      return false;
    } finally {
      view.setMutationPending(false);
    }
  }

  return {
    start(initialFilters = {}) {
      return load(initialFilters);
    },
    applyFilters(nextFilters = {}) {
      return load(nextFilters);
    },
    refresh() {
      return load(filters);
    },
    async submit(draft) {
      const checked = validateDraft(draft, categories ?? []);
      if (!checked.valid) {
        view.showFormErrors(checked.errors);
        return false;
      }
      view.showFormErrors({});
      const isEditing = editingId !== null;
      const id = editingId;
      const ok = await mutate(
        () => (isEditing ? api.updateTask(id, checked.value) : api.createTask(checked.value)),
        isEditing ? "Задача изменена." : "Задача добавлена.",
      );
      if (ok) {
        editingId = null;
        view.setFormTask(null);
      }
      return ok;
    },
    beginEdit(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        view.notify("Задача не найдена в текущем списке. Обновите список.", "error");
        return;
      }
      editingId = id;
      view.showFormErrors({});
      view.setFormTask(task);
    },
    cancelEdit() {
      editingId = null;
      view.showFormErrors({});
      view.setFormTask(null);
    },
    async toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        view.notify("Задача не найдена в текущем списке. Обновите список.", "error");
        return false;
      }
      return mutate(() => api.setTaskCompleted(id, !task.completed), "Статус задачи изменён.");
    },
    async deleteTask(id) {
      const ok = await mutate(() => api.deleteTask(id), "Задача удалена.");
      if (ok && editingId === id) {
        editingId = null;
        view.setFormTask(null);
      }
      return ok;
    },
    async resetData() {
      const ok = await mutate(() => api.resetDemoData(), "Данные сервера восстановлены.");
      if (ok) {
        editingId = null;
        view.setFormTask(null);
      }
      return ok;
    },
    destroy() {
      destroyed = true;
      activeController?.abort();
    },
  };
}
