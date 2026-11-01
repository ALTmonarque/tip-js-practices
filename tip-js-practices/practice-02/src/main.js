import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

function printStats(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`${label}: всего ${total}; выполнено ${completed}; осталось ${pending}`);
  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}

// Успех: возвращаем новый массив. Отказ: выводим ошибку и оставляем прежний.
function applyResult(currentTasks, result, label) {
  if (result.ok) {
    console.log(`OK: ${label}`);
    return result.tasks;
  }
  console.error(`Ошибка (${label}): ${result.error}`);
  return currentTasks;
}

function ids(tasks) {
  return tasks.map((task) => task.id);
}

// ============ Создание задачи (createTask) ============
console.log("===== createTask =====");
console.log("Успех:", createTask(99, "  Пробный пример  ", "high"));
console.log("Ошибка:", createTask(0, "Плохой id"));

// ============ Общий сценарий ============
console.log("\n===== Общий сценарий (demoTasks) =====");

const demoSnapshot = JSON.stringify(demoTasks);
let currentTasks = demoTasks;

console.log("Названия:", getTaskTitles(currentTasks));
console.log("Невыполненные id:", ids(getPendingTasks(currentTasks)));
console.log("Задача id=4:", findTaskById(currentTasks, 4));
printStats("Исходный набор", currentTasks);

currentTasks = applyResult(currentTasks, addTask(currentTasks, 20, "Добавить проверку", "high"), "добавление id=20");
printStats("После добавления id=20", currentTasks);

currentTasks = applyResult(currentTasks, setTaskCompleted(currentTasks, 4, true), "выполнена id=4");
printStats("После выполнения id=4", currentTasks);

currentTasks = applyResult(currentTasks, renameTask(currentTasks, 10, "Подготовить инструкцию запуска"), "переименование id=10");
printStats("После переименования id=10", currentTasks);

currentTasks = applyResult(currentTasks, removeTask(currentTasks, 7), "удаление id=7");
printStats("После удаления id=7", currentTasks);

console.log("Итоговые id:", ids(currentTasks));
console.table(currentTasks);

// Обработанная ошибка: повторяющийся id
currentTasks = applyResult(currentTasks, addTask(currentTasks, 4, "Дубликат"), "добавление id=4 (дубликат)");
console.log("Задач после отказа:", currentTasks.length);

console.log("demoTasks не изменён:", JSON.stringify(demoTasks) === demoSnapshot);

// ============ Сценарий варианта ============
console.log(`\n===== Сценарий варианта ${variantNumber} (variantTasks) =====`);

const variantSnapshot = JSON.stringify(variantTasks);
let mine = variantTasks;

printStats("Исходный набор", mine);

mine = applyResult(mine, addTask(mine, 80, "Подготовить отчёт о прототипе", "medium"), "добавление id=80");
printStats("После добавления id=80", mine);

mine = applyResult(mine, setTaskCompleted(mine, 11, true), "выполнена id=11");
printStats("После выполнения id=11", mine);

mine = applyResult(mine, renameTask(mine, 23, "Уточнить список требований к прототипу"), "переименование id=23");
printStats("После переименования id=23", mine);

mine = applyResult(mine, removeTask(mine, 37), "удаление id=37");
printStats("После удаления id=37", mine);

mine = applyResult(mine, addTask(mine, 80, "Повторное добавление"), "повторное добавление id=80");

console.log("Итоговые id:", ids(mine));
console.table(mine);
console.log("variantTasks не изменён:", JSON.stringify(variantTasks) === variantSnapshot);