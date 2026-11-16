// КР2, задание 1: проверка названия задачи через validateTaskDraft (ПР4).
import { validateTaskDraft } from "../src/form-validation.js";

const tasks = [];
const base = { id: "20", priority: "high" };

const okResult = validateTaskDraft({ ...base, title: "  Изучить localStorage  " }, tasks);
console.log('title = "  Изучить localStorage  "');
console.log(JSON.stringify(okResult));
console.log(`ok: ${okResult.ok}; value.title = ${JSON.stringify(okResult.value.title)}`);

const badResult = validateTaskDraft({ ...base, title: "   " }, tasks);
console.log('\ntitle = "   "');
console.log(JSON.stringify(badResult));
console.log(`ok: ${badResult.ok}; errors.title = ${JSON.stringify(badResult.errors.title)}`);
