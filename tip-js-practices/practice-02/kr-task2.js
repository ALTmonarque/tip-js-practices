import { setTaskCompleted } from "./src/task-service.js";
import { demoTasks } from "./src/data.js";
console.log(setTaskCompleted(demoTasks, 4, true));
console.log(demoTasks);
console.log(setTaskCompleted(demoTasks, 777, true));