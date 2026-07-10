import { copyFile, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve("dist");

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "assets", "tiles"), { recursive: true });

await copyFile("index.html", resolve(dist, "index.html"));
await cp("src", resolve(dist, "src"), { recursive: true });
await cp(resolve("assets", "tiles", "b2"), resolve(dist, "assets", "tiles", "b2"), { recursive: true });
await copyFile(resolve("assets", "tiles", "LICENSE.md"), resolve(dist, "assets", "tiles", "LICENSE.md"));
await cp(resolve("assets", "fonts"), resolve(dist, "assets", "fonts"), { recursive: true });
await writeFile(resolve(dist, ".nojekyll"), "", "utf8");

console.log(`static site built at ${dist}`);
