import type { RandomSource } from "./random.ts";

export function createId(prefix: string, rng: RandomSource): string {
  const value = Math.floor(rng.float() * Number.MAX_SAFE_INTEGER).toString(36).padStart(10, "0");
  return `${prefix}_${value}`;
}
