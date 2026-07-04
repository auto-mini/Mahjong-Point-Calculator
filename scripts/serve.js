import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { extname, isAbsolute, relative, resolve } from "node:path";

const args = new Map(process.argv.slice(2).flatMap((item, index, items) => item.startsWith("--") ? [[item.slice(2), items[index + 1]]] : []));
const root = resolve(args.get("root") || process.env.SERVE_ROOT || await defaultRoot());
const port = Number(args.get("port") || process.env.PORT || 4173);
const host = args.get("host") || process.env.HOST || "127.0.0.1";
const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".png", "image/png"],
  [".woff2", "font/woff2"],
  [".md", "text/markdown; charset=utf-8"],
]);
const securityHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'self'; img-src 'self' data:; font-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'self'",
};

async function defaultRoot() {
  try {
    await access(resolve("dist", "index.html"));
    return "dist";
  } catch {
    return ".";
  }
}

function isInsideRoot(file) {
  const path = relative(root, file);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

function localNetworkUrls() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => `http://${item.address}:${port}`);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://localhost:${port}`);
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8", ...securityHeaders });
    response.end("Bad request");
    return;
  }
  const requested = decodedPath === "/" ? "index.html" : decodedPath.replace(/^[/\\]+/, "");
  const file = resolve(root, requested);
  if (!isInsideRoot(file)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8", ...securityHeaders });
    response.end("Forbidden");
    return;
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not a file");
    response.writeHead(200, {
      "content-type": types.get(extname(file)) || "application/octet-stream",
      "cache-control": "no-store",
      ...securityHeaders,
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8", ...securityHeaders });
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Serving ${root}`);
  console.log(`Local: http://127.0.0.1:${port}`);
  if (host === "0.0.0.0") {
    for (const item of localNetworkUrls()) console.log(`LAN: ${item}`);
  }
});
