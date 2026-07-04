import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2] || ".";
const required = [
  "index.html",
  "src/app.js",
  "src/domain.js",
  "src/styles.css",
  "assets/tiles/LICENSE.md",
  "assets/tiles/b2/Man1.png",
  "assets/tiles/b2/Man5-Dora.png",
  "assets/tiles/b2/Pin5-Dora.png",
  "assets/tiles/b2/Sou5-Dora.png",
  "assets/tiles/b2/Ton.png",
  "assets/tiles/b2/Chun.png",
];

for (const file of required) {
  await access(join(root, file));
}

if (root === ".") {
  await access("tests/domain.test.js");
}

const forbiddenInDist = ["docs", "outputs", "tests", "work", ".git"];
if (root !== ".") {
  for (const name of forbiddenInDist) {
    await access(join(root, name))
      .then(() => {
        throw new Error(`dist must not include ${name}`);
      })
      .catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
  }
}

const html = await readFile(join(root, "index.html"), "utf8").catch(() => "");
if (html && !html.includes('type="module"')) {
  throw new Error("index.html must load the app as a module");
}
if (html && !html.includes('http-equiv="Content-Security-Policy"')) {
  throw new Error("index.html must include a meta Content-Security-Policy for GitHub Pages");
}
if (html && !html.includes('name="referrer" content="no-referrer"')) {
  throw new Error("index.html must include a no-referrer policy");
}

console.log(`static app files verified: ${root}`);
