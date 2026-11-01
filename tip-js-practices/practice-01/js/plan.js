"use strict";

const totalTasks = 7;
const completedTasks = 2;
const dailyLimit = 2;

if (typeof totalTasks !== "number" || typeof completedTasks !== "number") {
  console.log("Ошибка: количество задач должно быть числом, а не другим типом");
} else if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
  console.log("Ошибка: недопустимое числовое значение (NaN или бесконечность)");
} else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом");
} else if (totalTasks < 0 || completedTasks < 0) {
  console.log("Ошибка: количество задач не может быть отрицательным");
} else if (totalTasks > 1000) {
  console.log("Ошибка: общее количество задач не должно превышать 1000");
} else if (completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше задач, чем существует");
} else if (typeof dailyLimit !== "number") {
  console.log("Ошибка: дневная норма должна быть числом, а не другим типом");
} else if (!Number.isInteger(dailyLimit)) {
  console.log("Ошибка: дневная норма должна быть целым числом");
} else if (dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневная норма должна быть от 1 до 1000");
} else {
  let remaining = totalTasks - completedTasks;

  if (remaining === 0) {
    console.log("Все задачи уже выполнены");
    console.log("Потребуется дней: 0");
  } else {
    console.log(`Осталось задач: ${remaining}`);

    let day = 0;
    while (remaining > 0) {
      day += 1;
      const doneToday = Math.min(dailyLimit, remaining);
      remaining -= doneToday;
      console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`);
    }

    console.log(`Потребуется дней: ${day}`);
  }
}
