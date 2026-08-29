import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = new URL("../", import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (match) => match.slice(1));
const mimeTypes: Readonly<Record<string, string>> = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png" };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  if (pathname === "/") { response.writeHead(302, { Location: "/prototype/monsterdex/" }).end(); return; }
  const relative = pathname.replace(/^\/+/, "") || "prototype/monsterdex/index.html";
  const requestedPath = relative.endsWith("/") ? `${relative}index.html` : relative;
  const path = normalize(join(root, requestedPath));
  if (!path.startsWith(normalize(root))) { response.writeHead(403).end("Forbidden"); return; }
  try {
    const info = await stat(path);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": mimeTypes[extname(path)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    createReadStream(path).pipe(response);
  } catch { response.writeHead(404).end("Not found"); }
});
server.listen(4173, "127.0.0.1", () => console.log("Monsterdex prototype: http://127.0.0.1:4173"));
