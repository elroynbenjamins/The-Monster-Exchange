import type { GeneId, Genes, SpeciesDefinition } from "../core/types.ts";
import type { RandomSource } from "../core/random.ts";

const GENE_IDS: readonly GeneId[] = ["hp", "attack", "defense", "speed"];

export function generateGenes(species: SpeciesDefinition, rng: RandomSource, qualityBias = 0): Genes {
  return Object.fromEntries(GENE_IDS.map((gene) => {
    const cap = species.geneCaps[gene];
    const raw = Math.round(((rng.float() + rng.float()) / 2 + qualityBias) * cap);
    return [gene, Math.max(0, Math.min(cap, raw))];
  })) as unknown as Genes;
}

export function calculatePotential(genes: Genes, caps: Genes): number {
  const ratios = GENE_IDS.map((gene) => genes[gene] / caps[gene]);
  return Math.round((ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 100);
}

export function inheritGenes(a: Genes, b: Genes, caps: Genes, rng: RandomSource): Genes {
  return Object.fromEntries(GENE_IDS.map((gene) => {
    const midpoint = (a[gene] + b[gene]) / 2;
    const variation = rng.int(-4, 4);
    return [gene, Math.max(0, Math.min(caps[gene], Math.round(midpoint + variation)))];
  })) as unknown as Genes;
}
