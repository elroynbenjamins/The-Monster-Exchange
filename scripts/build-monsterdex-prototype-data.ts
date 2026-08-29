import { writeFile } from "node:fs/promises";
import { content } from "../src/content/index.ts";

const species = content.species.filter(({ catalogNumber }) => catalogNumber <= 90).sort((a, b) => a.catalogNumber - b.catalogNumber).map(({ catalogNumber, id, name, types, rarity, description, evolutionStage, evolutionLineLength, habitats }) => ({ catalogNumber, id, name, types, rarity, description, evolutionStage, evolutionLineLength, habitats }));
await writeFile(new URL("../prototype/monsterdex/catalog-data.js", import.meta.url), `window.MONSTERDEX_SPECIES = ${JSON.stringify(species, null, 2)};\n`);
