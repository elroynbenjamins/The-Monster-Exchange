import type { ThemePreference } from "../game/state.ts";

export type ResolvedTheme = "light" | "dark";

export interface ThemePalette {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  border: string;
  positive: string;
  warning: string;
  danger: string;
  focus: string;
}

export const THEME_PALETTES: Readonly<Record<ResolvedTheme, ThemePalette>> = {
  light: {
    background: "#f5f1df", surface: "#fffdf4", surfaceRaised: "#ffffff", text: "#18251f",
    textMuted: "#53635a", accent: "#176b52", onAccent: "#ffffff", border: "#bdc8bc",
    positive: "#26734d", warning: "#8a5900", danger: "#a62f35", focus: "#006fc9",
  },
  dark: {
    background: "#101813", surface: "#18231c", surfaceRaised: "#202e25", text: "#eef4ec",
    textMuted: "#a8b8ad", accent: "#6bd0a5", onAccent: "#092117", border: "#415348",
    positive: "#6ed39d", warning: "#f0bd61", danger: "#ff8a91", focus: "#72b9ff",
  },
};

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  return preference === "system" ? (systemPrefersDark ? "dark" : "light") : preference;
}
