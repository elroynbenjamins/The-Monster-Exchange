import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createPrototypeServer } from "../scripts/prototype-server.ts";

test("preview serves screen directories and refuses private or malformed paths", async () => {
  const server = createPrototypeServer();
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const root = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const path of ["/", "/prototype/welcome/", "/prototype/battle/", "/prototype/world-map/", "/prototype/monsterdex/"]) {
      const result = await fetch(root + path);
      assert.equal(result.status, 200, path);
      assert.match(await result.text(), /<!doctype html>/i);
    }
    assert.match(await (await fetch(root + "/")).text(), /The Monster Exchange — Welcome/);
    assert.equal((await fetch(root + "/.git/config")).status, 404);
    assert.equal((await fetch(root + "/assets/%2e%2e%5cpackage.json")).status, 404);
    assert.equal((await fetch(root + "/%zz")).status, 400);
    assert.match((await fetch(root + "/assets/pixel/battle/monster-exchange-battle-sprites-v1/sprites.json")).headers.get("content-type")!, /application\/json/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
