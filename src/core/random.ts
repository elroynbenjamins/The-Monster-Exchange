export interface RandomSource {
  float(): number;
  int(min: number, max: number): number;
  pick<T>(values: readonly T[]): T;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  float(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x1_0000_0000;
  }

  int(min: number, max: number): number {
    if (max < min) throw new Error(`Invalid random range ${min}..${max}`);
    return min + Math.floor(this.float() * (max - min + 1));
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) throw new Error("Cannot pick from an empty list");
    return values[this.int(0, values.length - 1)]!;
  }
}
