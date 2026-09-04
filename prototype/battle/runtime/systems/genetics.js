                                                                         
                                                      

const GENE_IDS                    = ["hp", "attack", "defense", "speed"];

export function generateGenes(species                   , rng              , qualityBias = 0)        {
  return Object.fromEntries(GENE_IDS.map((gene) => {
    const cap = species.geneCaps[gene];
    const raw = Math.round(((rng.float() + rng.float()) / 2 + qualityBias) * cap);
    return [gene, Math.max(0, Math.min(cap, raw))];
  }))                    ;
}

export function calculatePotential(genes       , caps       )         {
  const ratios = GENE_IDS.map((gene) => genes[gene] / caps[gene]);
  return Math.round((ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 100);
}

export function inheritGenes(a       , b       , caps       , rng              )        {
  return Object.fromEntries(GENE_IDS.map((gene) => {
    const midpoint = (a[gene] + b[gene]) / 2;
    const variation = rng.int(-4, 4);
    return [gene, Math.max(0, Math.min(caps[gene], Math.round(midpoint + variation)))];
  }))                    ;
}
