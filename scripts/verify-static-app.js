import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2] || ".";
const tileFiles = [
  "Man1.png",
  "Man2.png",
  "Man3.png",
  "Man4.png",
  "Man5.png",
  "Man5-Dora.png",
  "Man6.png",
  "Man7.png",
  "Man8.png",
  "Man9.png",
  "Pin1.png",
  "Pin2.png",
  "Pin3.png",
  "Pin4.png",
  "Pin5.png",
  "Pin5-Dora.png",
  "Pin6.png",
  "Pin7.png",
  "Pin8.png",
  "Pin9.png",
  "Sou1.png",
  "Sou2.png",
  "Sou3.png",
  "Sou4.png",
  "Sou5.png",
  "Sou5-Dora.png",
  "Sou6.png",
  "Sou7.png",
  "Sou8.png",
  "Sou9.png",
  "Ton.png",
  "Nan.png",
  "Shaa.png",
  "Pei.png",
  "Haku.png",
  "Hatsu.png",
  "Chun.png",
];
const required = [
  "index.html",
  "src/app.js",
  "src/domain.js",
  "src/styles.css",
  "assets/tiles/LICENSE.md",
  "assets/fonts/wanted-sans/WantedSansVariable.woff2",
  "assets/fonts/wanted-sans/OFL.txt",
  "assets/fonts/wanted-sans/NOTICE.md",
  ...tileFiles.map((file) => `assets/tiles/b2/${file}`),
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
if (html && !html.includes('rel="icon"')) {
  throw new Error("index.html must include a favicon link to avoid a missing icon request");
}
if (html && !html.includes('http-equiv="Content-Security-Policy"')) {
  throw new Error("index.html must include a meta Content-Security-Policy for GitHub Pages");
}
if (html && !html.includes("font-src 'self'")) {
  throw new Error("index.html Content-Security-Policy must allow self-hosted fonts");
}
if (html && !html.includes('name="referrer" content="no-referrer"')) {
  throw new Error("index.html must include a no-referrer policy");
}

if (root !== ".") {
  await access(join(root, ".nojekyll"));
  const headers = await readFile(join(root, "_headers"), "utf8").catch(() => "");
  if (!headers.includes("Content-Security-Policy: default-src 'self'")) {
    throw new Error("dist _headers must include the Content-Security-Policy header");
  }
  if (!headers.includes("X-Content-Type-Options: nosniff")) {
    throw new Error("dist _headers must include X-Content-Type-Options");
  }
}

const tileLicense = await readFile(join(root, "assets/tiles/LICENSE.md"), "utf8").catch(() => "");
if (!tileLicense.includes("FluffyStuff/riichi-mahjong-tiles")) {
  throw new Error("tile license must record the upstream tile source");
}

console.log(`static app files verified: ${root}`);
