import { access, readFile } from "node:fs/promises";

const required = [
  "index.html",
  "src/app.js",
  "src/domain.js",
  "src/styles.css",
  "tests/domain.test.js",
];

for (const file of required) {
  await access(file);
}

const html = await readFile("index.html", "utf8").catch(() => "");
if (html && !html.includes('type="module"')) {
  throw new Error("index.html must load the app as a module");
}

console.log("static app files verified");
