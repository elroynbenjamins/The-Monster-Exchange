import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, sep } from "node:path";
import { stripTypeScriptTypes } from "node:module";

// Build only the pure combat module graph. Output works offline without a Node server.
const sourceRoot = resolve("src");
const outputRoot = resolve("prototype/battle/runtime");
const visited = new Set();
async function build(file) {
  if (visited.has(file)) return;
  if (!file.startsWith(sourceRoot + sep)) throw new Error("Dependency escaped src");
  visited.add(file);
  let javascript = stripTypeScriptTypes(await readFile(file, "utf8"), { mode: "strip" });
  const imports = [...javascript.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+\.ts)["']/g)];
  for (const match of imports) await build(resolve(dirname(file), match[1]));
  javascript = javascript.replace(/(["'])(\.[^"']+)\.ts\1/g, "$1$2.js$1");
  const target = resolve(outputRoot, relative(sourceRoot, file).replace(/\.ts$/, ".js"));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, javascript);
}
await build(resolve(sourceRoot, "game/training-battle.ts"));
console.log(`Built ${visited.size} offline combat modules.`);
