// Общий контрольный набор не изменяется: он используется в автоматических проверках.
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Индивидуальный вариант 5 (номер 21 в журнале): «Разработка командного прототипа».
// Первые четыре задачи выполнены, поэтому начальный прогресс равен 66.7%.
export const variantNumber = 5;
export const variantTasks = [
  { id: 11, title: "Согласовать состав команды и роли", completed: true, priority: "medium" },
  { id: 23, title: "Описать требования к прототипу", completed: true, priority: "high" },
  { id: 37, title: "Нарисовать макеты основных экранов", completed: true, priority: "low" },
  { id: 41, title: "Собрать каркас интерфейса", completed: true, priority: "medium" },
  { id: 58, title: "Подключить хранение данных", completed: false, priority: "high" },
  { id: 64, title: "Провести демонстрацию команде", completed: false, priority: "medium" },
];
