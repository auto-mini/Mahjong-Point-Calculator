import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer, get } from "node:http";
import { setTimeout as delay } from "node:timers/promises";

async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function statusCode(port, path) {
  return await new Promise((resolve, reject) => {
    const request = get({ host: "127.0.0.1", port, path }, (response) => {
      response.resume();
      response.on("end", () => resolve(response.statusCode));
    });
    request.on("error", reject);
  });
}

async function waitForServer(port) {
  let lastError;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if (await statusCode(port, "/index.html") === 200) return;
    } catch (error) {
      lastError = error;
    }
    await delay(50);
  }
  throw lastError || new Error("server did not start");
}

test("preview server does not expose repository internals from root", async (t) => {
  const port = await freePort();
  const child = spawn(process.execPath, ["scripts/serve.js", "--root", ".", "--port", String(port)], {
    cwd: process.cwd(),
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  t.after(() => {
    child.kill();
  });

  await waitForServer(port);
  assert.equal(await statusCode(port, "/index.html"), 200);
  assert.equal(await statusCode(port, "/src/app.js"), 200);
  assert.equal(await statusCode(port, "/assets/tiles/LICENSE.md"), 200);
  assert.equal(await statusCode(port, "/package.json"), 404);
  assert.equal(await statusCode(port, "/docs/review-decisions.md"), 404);
  assert.equal(await statusCode(port, "/work/create_design_v4.py"), 404);
  assert.equal(await statusCode(port, "/.git/config"), 404);
  assert.equal(await statusCode(port, "/src/%2e%2e/package.json"), 404);
  assert.equal(stderr, "");
});
