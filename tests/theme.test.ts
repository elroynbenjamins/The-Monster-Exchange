import assert from "node:assert/strict";
import test from "node:test";
import { THEME_PALETTES, content, createNewGame, resolveTheme, setReducedMotion, setThemePreference } from "../src/index.ts";

test("new saves follow the device theme by default", () => {
  const state = createNewGame("Lux", 9, content.contentVersion);
  assert.deepEqual(state.uiPreferences, { theme: "system", reducedMotion: false });
  assert.equal(resolveTheme(state.uiPreferences.theme, true), "dark");
  assert.equal(resolveTheme(state.uiPreferences.theme, false), "light");
});

test("appearance preferences are immutable and explicit choices override the device", () => {
  const original = createNewGame("Lux", 9, content.contentVersion);
  const dark = setReducedMotion(setThemePreference(original, "dark"), true);
  assert.equal(original.uiPreferences.theme, "system");
  assert.deepEqual(dark.uiPreferences, { theme: "dark", reducedMotion: true });
  assert.equal(resolveTheme(dark.uiPreferences.theme, false), "dark");
});

test("light and dark palettes expose the same semantic color roles", () => {
  assert.deepEqual(Object.keys(THEME_PALETTES.light), Object.keys(THEME_PALETTES.dark));
  assert.notEqual(THEME_PALETTES.light.background, THEME_PALETTES.dark.background);
  assert.notEqual(THEME_PALETTES.light.text, THEME_PALETTES.dark.text);
});
