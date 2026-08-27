import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { APP_METADATA } from "../src/index.ts";

test("all platform identifiers use the canonical package name", async () => {
  const config = JSON.parse(await readFile(new URL("../app.config.json", import.meta.url), "utf8")) as {
    packageId: string;
    android: { applicationId: string };
    ios: { bundleIdentifier: string };
  };
  const expected = "com.elroybenjamins.themonsterexchange";
  assert.equal(APP_METADATA.packageId, expected);
  assert.equal(APP_METADATA.androidApplicationId, expected);
  assert.equal(APP_METADATA.iosBundleIdentifier, expected);
  assert.equal(config.packageId, expected);
  assert.equal(config.android.applicationId, expected);
  assert.equal(config.ios.bundleIdentifier, expected);
});
