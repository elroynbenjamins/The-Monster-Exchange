import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

export function createPrototypeServer(root = process.cwd()) {
  root = resolve(root);
  const types: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png" };
  return createServer((request, response) => {
    let requestPath: string;
    try { requestPath = decodeURIComponent((request.url ?? "/").split("?")[0]); }
    catch { response.writeHead(400).end("Invalid path"); return; }
    const relative = requestPath === "/" ? "prototype/welcome/index.html" : requestPath.replace(/^\/+/, "");
    let path = resolve(root, relative);
    const allowed = ["prototype", "assets"].some(directory => path.startsWith(join(root, directory) + sep));
    if (!allowed) { response.writeHead(404).end("Not found"); return; }
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, "index.html");
    if (!existsSync(path) || !statSync(path).isFile()) { response.writeHead(404).end("Not found"); return; }
    response.writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    createReadStream(path).on("error", () => response.destroy()).pipe(response);
  });
}
