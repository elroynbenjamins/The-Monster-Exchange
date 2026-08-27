# Monstermarket design bible — recovered foundation

This is the implementation-facing digest of the accessible “Monster Market Design” conversation. It preserves current decisions while the original conversation remains the long-form source.

## Vision and pillars

Monstermarket combines monster collecting with a simulated economy. A creature is valuable not only because it wins fights, but because of genetics, traits, pedigree, rarity, appearance, learned skills, records, and shifting demand. Exploration supplies the ecology, breeding creates new individuals, homebase turns time and resources into progress, combat changes reputation and demand, and the market connects every loop.

The tone is adventurous rather than lethal: monsters are knocked out, captured, trained, traded, bred, and remembered. Species must be clearly original in name, silhouette, anatomy, palette, evolution, abilities, and lore.

## Monsters and species

A species defines types, ecology tags, base combat stats, genetic ranges, abilities, passive, possible traits, breeding groups, habitat, rarity, art references, and evolution paths. An individual stores its own ID, sex, level/XP, genes, potential, traits, known/equipped skills, lineage, ownership, health/stamina, variant, and history.

Potential is a readable 0–100 summary derived from genes. Final combat stats are species base stats + level growth + genetic scaling + traits + equipment + temporary effects. Initial level range is 1–50. Core stats are HP, Attack, Defense, Speed, and Energy; secondary values are derived.

## Traits, skills, passives, and evolution

Traits create individual variation and may affect combat, breeding, exploration, or economics. Skills are selected from species pools and use data-defined power, type, energy, cooldown, target rules, status chances, visual IDs, and AI hints. A monster may know 8–12 skills but equips three. Passives use reusable triggers. Evolutions have explicit requirements and can alter stats, types, tags, passive, and skill access; they are not merely linear stat upgrades.

## World and regions

Regions contain zones, species pools, resources, settlements, hazards, weather, and progression gates. Zones have fixed level ranges rather than direct player scaling. Weather, seasons, population events, and hazards modify encounters, routes, combat, and resource rewards. Good preparation can turn dangerous conditions into profitable rare-content opportunities.

## Marketplace

Listings sell specific individuals, not generic species. Each includes seller, asking price, duration, and visibility. A valuation model considers species baseline, potential/genetics, traits, level/evolution, rarity/variant, skills, age, pedigree, fame/battle record, regional supply, demand, and events. NPC purchases and sales affect the same indices as player activity. Market ticks expire listings, normalize pressure, introduce NPC activity later, and emit explainable events.

## Breeding

Breeding uses compatibility groups, sex rules where applicable, fertility/cooldowns, building capacity, fees, and lineage checks. Offspring inherit a noisy combination of parental genes, may inherit eligible skills/traits, and records both parents. Close inbreeding is blocked by default. Better breeding infrastructure improves capacity and information, not guaranteed perfect offspring.

## Homebase

The homebase is a constrained set of building slots. Buildings provide breeding, habitat, healing, storage, research, farming, crafting, and expedition preparation. Upgrades consume resources and time. Production is job-based and advanced by world ticks so it remains compatible with offline progress.

## Exploration and expeditions

An expedition is a route through generated nodes: encounters, resources, choices, hazards, rest points, discoveries, and bosses. Region/zone, weather, season, difficulty, population, and world events shape generation. Teams spend long-term stamina across the run. Monster types/tags and equipment open routes or reduce risk. Encounters can be avoided, friendly, ambushes, packs, alphas, or multi-wave battles.

## Combat

Standard serious combat uses three active monsters and two reserves. It is speed/timeline based: basic attacks flow automatically, while the player queues important skills, targets, switches, and consumables. Energy and cooldowns limit skills. Assisted play is the default, with manual and full-auto modes.

The centralized 18-type chart starts with 1.5× effective, 1× neutral, 0.67× resisted, and 0× immune, with caps for dual-type extremes. Statuses include Burn, Poison, Shock, Freeze, Sleep, Stun, Bleed, Wet, Fear, Confusion, and Shield. AI scores available actions using configurable profiles and never reads hidden information. Difficulty comes from team construction and decision quality, not invisible stat inflation.

## Characters and trainers

Named trainers own persistent monsters and improve through the simulated systems. A main rival focuses on combat, rankings, and trading; a friend/ally focuses on exploration, research, discoveries, and story support. Both progress, make imperfect decisions, and may trade or breed their actual roster. Generated trainers use region, archetype, team budget, species pool, genetic range, equipment tier, AI level, and synergy preferences.

## Presentation

The target identity is consistent original pixel art. Large portraits/sprites, compact impact animations, regional backgrounds, readable icons, HP/Energy bars, and restrained screen effects are sufficient; fully animated creatures are not a foundation requirement.
