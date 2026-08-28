import type { EvolutionDefinition, PassiveDefinition, SkillDefinition } from "./definitions.ts";
import { GAME_TYPES, type GameType, type Rarity, type SpeciesDefinition, type Stats } from "../core/types.ts";

export interface MonsterConcept {
  catalogNumber: number;
  name: string;
  types: readonly [GameType, GameType?];
  rarity: Rarity;
  description: string;
  stage: number;
  totalStages: number;
  lineId: string;
}

export const MONSTER_CONCEPTS: readonly MonsterConcept[] = [
  {"catalogNumber":1,"name":"Mossveil","types":["grass","poison"],"rarity":"common","description":"A velvet-backed marsh mollusk carrying a tiny living thicket. It filters toxins from wet soil and stores them in glowing dew sacs.","stage":1,"totalStages":2,"lineId":"mossveil"},
  {"catalogNumber":2,"name":"Canopyre","types":["grass","fairy"],"rarity":"uncommon","description":"A broad-shelled forest grazer crowned by a miniature canopy. Its drifting pollen calms nearby creatures and helps damaged woodland recover.","stage":2,"totalStages":2,"lineId":"mossveil"},
  {"catalogNumber":3,"name":"Voltgrazer","types":["electric","ground"],"rarity":"uncommon","description":"A lean herd beast with copper hooves and storm-sensitive whiskers. It stamps rhythmic charges into the earth to warn its herd.","stage":1,"totalStages":2,"lineId":"voltgrazer"},
  {"catalogNumber":4,"name":"Tempestride","types":["electric","ground"],"rarity":"rare","description":"A tall, plated runner with branching lightning horns. It races along storm fronts and leaves glassy hoofprints where its charge strikes sand.","stage":2,"totalStages":2,"lineId":"voltgrazer"},
  {"catalogNumber":5,"name":"Cindlet","types":["fire"],"rarity":"common","description":"A round burrowing creature with a coal-black snout and ember belly. It sleeps inside warm ash and sneezes sparks when startled.","stage":1,"totalStages":3,"lineId":"cindlet"},
  {"catalogNumber":6,"name":"Kilnback","types":["fire","rock"],"rarity":"uncommon","description":"A squat furnace-backed digger with clay armor plates. Minerals swallowed underground are fired into new protective scales across its body.","stage":2,"totalStages":3,"lineId":"cindlet"},
  {"catalogNumber":7,"name":"Pyroclastor","types":["fire","steel"],"rarity":"rare","description":"A massive six-legged foundry beast with iron vents along its spine. Its slow footsteps leave molten seams that cool into valuable alloys.","stage":3,"totalStages":3,"lineId":"cindlet"},
  {"catalogNumber":8,"name":"Rillfin","types":["water"],"rarity":"common","description":"A ribbon-bodied stream swimmer with translucent fins shaped like leaves. It hides against river plants and guides lost hatchlings downstream.","stage":1,"totalStages":2,"lineId":"rillfin"},
  {"catalogNumber":9,"name":"Brineveil","types":["water","ghost"],"rarity":"rare","description":"A pale drifting swimmer wrapped in a curtain of seawater. It appears in flooded ruins and preserves faint impressions of voices carried by rivers.","stage":2,"totalStages":2,"lineId":"rillfin"},
  {"catalogNumber":10,"name":"Budmote","types":["grass","fairy"],"rarity":"common","description":"A thumb-sized seed creature with petal ears and floating pollen motes. Groups gather around healthy crops and mirror the colors of nearby flowers.","stage":1,"totalStages":2,"lineId":"budmote"},
  {"catalogNumber":11,"name":"Crownbloom","types":["grass","fairy"],"rarity":"rare","description":"An elegant long-legged creature crowned by rotating blossoms. It enriches exhausted soil while fiercely protecting nesting grounds from careless harvesters.","stage":2,"totalStages":2,"lineId":"budmote"},
  {"catalogNumber":12,"name":"Pebblit","types":["rock"],"rarity":"common","description":"A lively pebble-bodied scavenger with oversized gripping toes. It collects interesting stones and stacks them into small territorial markers.","stage":1,"totalStages":2,"lineId":"pebblit"},
  {"catalogNumber":13,"name":"Cairnox","types":["rock","fighting"],"rarity":"uncommon","description":"A broad-shouldered climber layered in mismatched stone plates. It rebuilds its armor after every battle using fragments from the surrounding terrain.","stage":2,"totalStages":2,"lineId":"pebblit"},
  {"catalogNumber":14,"name":"Gloamkit","types":["dark"],"rarity":"common","description":"A dusk-colored prowler with a mask-like face and lantern pupils. It steals shiny objects, then secretly returns them in more useful places.","stage":1,"totalStages":2,"lineId":"gloamkit"},
  {"catalogNumber":15,"name":"Nocturnyx","types":["dark","psychic"],"rarity":"rare","description":"A silent six-eyed hunter draped in shadowy membrane. It senses hostile intentions as ripples and misdirects pursuers with convincing false paths.","stage":2,"totalStages":2,"lineId":"gloamkit"},
  {"catalogNumber":16,"name":"Fuzzvolt","types":["electric","bug"],"rarity":"common","description":"A fuzzy beetle with static-charged antenna fans. It clings to woolly monsters and feeds harmlessly on excess electrical charge.","stage":1,"totalStages":2,"lineId":"fuzzvolt"},
  {"catalogNumber":17,"name":"Loomspark","types":["electric","bug"],"rarity":"uncommon","description":"A long-legged insect that spins luminous conductive thread. Colonies weave storm-catching nets between trees to power their underground nests.","stage":2,"totalStages":2,"lineId":"fuzzvolt"},
  {"catalogNumber":18,"name":"Mucklet","types":["poison","water"],"rarity":"common","description":"A cheerful mud-skimmer with a soft filter crest. It consumes polluted water and leaves behind dense, nutrient-rich pellets.","stage":1,"totalStages":2,"lineId":"mucklet"},
  {"catalogNumber":19,"name":"Bogrumbler","types":["poison","ground"],"rarity":"uncommon","description":"A heavy amphibious mound with reed-like pipes along its back. Its low calls stir swamp sediment and expose buried medicinal roots.","stage":2,"totalStages":2,"lineId":"mucklet"},
  {"catalogNumber":20,"name":"Chimeshell","types":["water","psychic"],"rarity":"rare","description":"A spiral-shelled tidal creature with hanging crystal feelers. Waves passing through its shell produce tones that subtly influence nearby emotions.","stage":1,"totalStages":1,"lineId":"chimeshell"},
  {"catalogNumber":21,"name":"Ashwing","types":["fire","flying"],"rarity":"uncommon","description":"A soot-gray glider with ember-lined wings and a shovel beak. It nests near wildfires and scatters heat-resistant seeds over burned land.","stage":1,"totalStages":2,"lineId":"ashwing"},
  {"catalogNumber":22,"name":"Solvulture","types":["fire","flying"],"rarity":"rare","description":"A radiant high-altitude scavenger with a sun-disc tail. It absorbs heat from cooling battlefields and releases it in brilliant thermal spirals.","stage":2,"totalStages":2,"lineId":"ashwing"},
  {"catalogNumber":23,"name":"Frostuft","types":["ice"],"rarity":"common","description":"A tiny round tundra grazer hidden beneath layered frost-wool. It rolls downhill to escape danger, gathering a larger icy coat as it goes.","stage":1,"totalStages":2,"lineId":"frostuft"},
  {"catalogNumber":24,"name":"Rimehorn","types":["ice","fighting"],"rarity":"uncommon","description":"A compact horned brawler wrapped in braided ice-wool. It challenges rivals by carving precise rings into frozen lakes with its hooves.","stage":2,"totalStages":2,"lineId":"frostuft"},
  {"catalogNumber":25,"name":"Gleamgulper","types":["fairy","water"],"rarity":"uncommon","description":"A balloon-like cave swimmer with a luminous throat pouch. It swallows reflections from underground pools and releases them as floating decoys.","stage":1,"totalStages":1,"lineId":"gleamgulper"},
  {"catalogNumber":26,"name":"Ferricrawl","types":["steel","bug"],"rarity":"common","description":"A flat iron-scaled insect that travels beneath loose scrap. It clips useful metal pieces into a shell resembling overlapping roof tiles.","stage":1,"totalStages":2,"lineId":"ferricrawl"},
  {"catalogNumber":27,"name":"Bastionsect","types":["steel","bug"],"rarity":"rare","description":"A fortress-shaped colony creature supported by many small legs. Smaller insects shelter inside its hollow armor and repair it between battles.","stage":2,"totalStages":2,"lineId":"ferricrawl"},
  {"catalogNumber":28,"name":"Wispling","types":["ghost"],"rarity":"common","description":"A curious flame-shaped spirit trailing loose strands of memory. It follows travelers who have forgotten something important but cannot explain what.","stage":1,"totalStages":2,"lineId":"wispling"},
  {"catalogNumber":29,"name":"Mournglade","types":["ghost","grass"],"rarity":"rare","description":"A solemn antlered spirit grown around pale woodland branches. Flowers bloom briefly wherever it helps a lingering memory find rest.","stage":2,"totalStages":2,"lineId":"wispling"},
  {"catalogNumber":30,"name":"Skyrill","types":["flying","normal"],"rarity":"common","description":"A narrow-bodied flock creature with sail-like ears. It whistles changing wind patterns that other animals use to predict approaching weather.","stage":1,"totalStages":2,"lineId":"skyrill"},
  {"catalogNumber":31,"name":"Galecrest","types":["flying","dragon"],"rarity":"rare","description":"A long aerial serpent with layered feather-fins and a compass-shaped crest. It rides pressure currents for weeks without touching ground.","stage":2,"totalStages":2,"lineId":"skyrill"},
  {"catalogNumber":32,"name":"Dunelet","types":["ground"],"rarity":"common","description":"A small desert digger with mirrored eyelids and paddle feet. It hides supplies beneath the sand and remembers every cache by starlight.","stage":1,"totalStages":2,"lineId":"dunelet"},
  {"catalogNumber":33,"name":"Mirrormaw","types":["ground","psychic"],"rarity":"rare","description":"A low-slung desert predator with polished mineral plates around its jaws. Heat reflections across its armor create misleading copies of its movements.","stage":2,"totalStages":2,"lineId":"dunelet"},
  {"catalogNumber":34,"name":"Vialtail","types":["poison"],"rarity":"uncommon","description":"A delicate arboreal creature whose segmented tail holds several colored venoms. It mixes different compounds depending on threats, diet, and season.","stage":1,"totalStages":1,"lineId":"vialtail"},
  {"catalogNumber":35,"name":"Runebuck","types":["psychic","grass"],"rarity":"rare","description":"A quiet forest ungulate with bark antlers etched by natural growth rings. Researchers interpret the changing patterns as maps of underground root networks.","stage":1,"totalStages":1,"lineId":"runebuck"},
  {"catalogNumber":36,"name":"Deepmaw","types":["water","dark"],"rarity":"rare","description":"A broad abyssal ambusher with a hinged lantern jaw. It offers smaller creatures shelter inside its false light before suddenly vanishing into darkness.","stage":1,"totalStages":1,"lineId":"deepmaw"},
  {"catalogNumber":37,"name":"Prismite","types":["rock","fairy"],"rarity":"epic","description":"A many-faceted cavern creature with stubby crystal limbs. Its body refracts emotions into colored light, making valuable individuals difficult to conceal.","stage":1,"totalStages":1,"lineId":"prismite"},
  {"catalogNumber":38,"name":"Cloudrum","types":["flying","electric"],"rarity":"uncommon","description":"A buoyant sky grazer with a hollow drum-like chest. Herds create rolling thunder rhythms that coordinate migrations between distant islands.","stage":1,"totalStages":1,"lineId":"cloudrum"},
  {"catalogNumber":39,"name":"Oathcoil","types":["steel","ghost"],"rarity":"epic","description":"A floating chain-serpent assembled from abandoned ceremonial metal. It binds itself to places or people whose promises remain unfinished.","stage":1,"totalStages":1,"lineId":"oathcoil"},
  {"catalogNumber":40,"name":"Riftwarden","types":["ghost","dragon"],"rarity":"legendary","description":"A vast angular creature with a starless opening through its torso. It appears only where unstable regions overlap and quietly seals dangerous spatial fractures.","stage":1,"totalStages":1,"lineId":"riftwarden"},
  {"catalogNumber":41,"name":"Glintad","types":["psychic"],"rarity":"common","description":"A round cave-dweller with glassy brow plates and wide vibration-sensitive feet. It projects simple colored shapes when curious or frightened.","stage":1,"totalStages":2,"lineId":"glintad"},
  {"catalogNumber":42,"name":"Facetoad","types":["psychic","rock"],"rarity":"uncommon","description":"A low crystal-backed amphibian whose many facial facets show different expressions. It bends attention away from itself by scattering thought-like reflections.","stage":2,"totalStages":2,"lineId":"glintad"},
  {"catalogNumber":43,"name":"Sootsnip","types":["fire","bug"],"rarity":"common","description":"A tiny charcoal insect with scissor-shaped forelegs. It trims burned plants and packs the clippings into warm, insulated nests.","stage":1,"totalStages":2,"lineId":"sootsnip"},
  {"catalogNumber":44,"name":"Cauterwing","types":["fire","bug"],"rarity":"uncommon","description":"A broad-winged insect patterned like cooling metal. Its heated wing edges seal damaged bark and protect forests after violent storms.","stage":2,"totalStages":2,"lineId":"sootsnip"},
  {"catalogNumber":45,"name":"Tidepup","types":["water"],"rarity":"common","description":"A playful shoreline crawler with finned ears and a pebble-filled tail pouch. It sorts colorful stones into rings at low tide.","stage":1,"totalStages":2,"lineId":"tidepup"},
  {"catalogNumber":46,"name":"Reefhowl","types":["water","rock"],"rarity":"uncommon","description":"A sturdy coastal runner armored in living reef plates. Its deep calls vibrate through seawater and warn distant colonies of danger.","stage":2,"totalStages":2,"lineId":"tidepup"},
  {"catalogNumber":47,"name":"Bramblejaw","types":["grass","dark"],"rarity":"common","description":"A thorn-muzzled forest scavenger with leafy camouflage. It steals discarded food and plants any seeds it cannot eat.","stage":1,"totalStages":2,"lineId":"bramblejaw"},
  {"catalogNumber":48,"name":"Thicketyr","types":["grass","dark"],"rarity":"rare","description":"A hulking ambush beast covered in tangled hedge armor. Entire woodland paths slowly shift when it relocates its hidden resting place.","stage":2,"totalStages":2,"lineId":"bramblejaw"},
  {"catalogNumber":49,"name":"Coilbud","types":["electric","grass"],"rarity":"common","description":"A spring-shaped vine creature with copper petals. It stores sunlight as a mild charge and launches itself between nearby branches.","stage":1,"totalStages":2,"lineId":"coilbud"},
  {"catalogNumber":50,"name":"Dynamoira","types":["electric","grass"],"rarity":"rare","description":"A tall flowering creature wound around a floating magnetic core. Its rotating leaves generate power while drawing rain toward dry ground.","stage":2,"totalStages":2,"lineId":"coilbud"},
  {"catalogNumber":51,"name":"Hushhare","types":["normal","ghost"],"rarity":"common","description":"A pale long-eared burrower whose footsteps make no sound. It collects noises in its hollow ears and releases them somewhere safer.","stage":1,"totalStages":2,"lineId":"hushhare"},
  {"catalogNumber":52,"name":"Pallop","types":["ghost","fairy"],"rarity":"uncommon","description":"A floating velvet-eared spirit with soft lantern markings. It absorbs frightening nighttime sounds and turns them into gentle dreamlike music.","stage":2,"totalStages":2,"lineId":"hushhare"},
  {"catalogNumber":53,"name":"Oreling","types":["steel"],"rarity":"common","description":"A small magnetic creature built from loose mineral flakes. It constantly rearranges its body to match the shape of nearby tools.","stage":1,"totalStages":2,"lineId":"oreling"},
  {"catalogNumber":54,"name":"Magnox","types":["steel","electric"],"rarity":"rare","description":"A powerful quadruped assembled around a humming magnetic ring. It pulls buried ore upward and leaves perfectly circular pits behind.","stage":2,"totalStages":2,"lineId":"oreling"},
  {"catalogNumber":55,"name":"Dustlet","types":["ground","flying"],"rarity":"common","description":"A feather-light desert creature with broad shovel wings. It swims through loose sand and bursts upward when the wind changes.","stage":1,"totalStages":2,"lineId":"dustlet"},
  {"catalogNumber":56,"name":"Siroccoil","types":["ground","flying"],"rarity":"uncommon","description":"A spiraling sand-serpent that rides inside its own miniature whirlwind. Its passing exposes old pathways without permanently damaging the dunes.","stage":2,"totalStages":2,"lineId":"dustlet"},
  {"catalogNumber":57,"name":"Chillip","types":["ice","bug"],"rarity":"common","description":"A blue larva wrapped in a shell of powdery frost. It survives warm periods by nesting beneath thick layers of snow.","stage":1,"totalStages":3,"lineId":"chillip"},
  {"catalogNumber":58,"name":"Crysalid","types":["ice","bug"],"rarity":"uncommon","description":"A suspended crystal cocoon with six slowly moving inner lights. Nearby moisture freezes into protective geometric curtains around it.","stage":2,"totalStages":3,"lineId":"chillip"},
  {"catalogNumber":59,"name":"Borealume","types":["ice","fairy"],"rarity":"rare","description":"A luminous winged creature whose trailing fins resemble an aurora. Its cold light guides migrating monsters across whiteout conditions.","stage":3,"totalStages":3,"lineId":"chillip"},
  {"catalogNumber":60,"name":"Knucklebud","types":["fighting"],"rarity":"common","description":"A root-footed sprout with heavy seedpod fists. It strengthens its flexible stalk by striking fallen logs in steady rhythms.","stage":1,"totalStages":2,"lineId":"knucklebud"},
  {"catalogNumber":61,"name":"Burlbrute","types":["fighting","grass"],"rarity":"uncommon","description":"A thick-limbed woodland wrestler protected by knotted bark growths. It clears blocked streams by lifting debris rather than breaking it.","stage":2,"totalStages":2,"lineId":"knucklebud"},
  {"catalogNumber":62,"name":"Pipscale","types":["poison"],"rarity":"common","description":"A tiny scaled hopper with bright warning freckles. It samples plants and changes color to show whether nearby fruit is safe.","stage":1,"totalStages":2,"lineId":"pipscale"},
  {"catalogNumber":63,"name":"Venodrake","types":["poison","dragon"],"rarity":"rare","description":"A slender gliding reptile with translucent venom sails. Each sail holds a different compound used for hunting, defense, or medicine.","stage":2,"totalStages":2,"lineId":"pipscale"},
  {"catalogNumber":64,"name":"Whirloo","types":["flying"],"rarity":"common","description":"A fluffy aerial creature shaped around a hollow central ring. It drifts on warm currents and whistles when air passes through its body.","stage":1,"totalStages":2,"lineId":"whirloo"},
  {"catalogNumber":65,"name":"Oracline","types":["flying","psychic"],"rarity":"uncommon","description":"A graceful ring-winged flier with dangling sensory threads. It changes migration direction shortly before distant weather systems begin to form.","stage":2,"totalStages":2,"lineId":"whirloo"},
  {"catalogNumber":66,"name":"Clinkshade","types":["dark","steel"],"rarity":"common","description":"A shy scrap-dweller hiding beneath a cloak of linked metal scales. The faint clinking it produces often seems to come from elsewhere.","stage":1,"totalStages":1,"lineId":"clinkshade"},
  {"catalogNumber":67,"name":"Mirthmew","types":["fairy","normal"],"rarity":"common","description":"A soft round companion creature with ribbon-like whiskers. It mimics laughter and gathers wherever tense groups need a harmless distraction.","stage":1,"totalStages":1,"lineId":"mirthmew"},
  {"catalogNumber":68,"name":"Siltwraith","types":["ghost","ground"],"rarity":"rare","description":"A slow riverbank spirit formed from layered mud and old footprints. It preserves the tracks of creatures that vanished during floods.","stage":1,"totalStages":1,"lineId":"siltwraith"},
  {"catalogNumber":69,"name":"Kitespine","types":["dragon","flying"],"rarity":"rare","description":"A thin high-altitude dragon stretched between flexible spine-fins. It anchors to mountain peaks with a long silken tail during storms.","stage":1,"totalStages":1,"lineId":"kitespine"},
  {"catalogNumber":70,"name":"Tusslegrub","types":["bug"],"rarity":"common","description":"A stout larva with padded horn nubs and six gripping feet. Groups settle disagreements through harmless pushing contests on fallen branches.","stage":1,"totalStages":2,"lineId":"tusslegrub"},
  {"catalogNumber":71,"name":"Rooklimb","types":["bug","fighting"],"rarity":"uncommon","description":"A tall angular insect with interlocking shield arms. It protects smaller colony members by forming coordinated moving barricades.","stage":2,"totalStages":2,"lineId":"tusslegrub"},
  {"catalogNumber":72,"name":"Drizzlepod","types":["water","poison"],"rarity":"common","description":"A floating rain-pool organism with dangling filter roots. It gathers airborne pollutants before they can settle into lakes.","stage":1,"totalStages":2,"lineId":"drizzlepod"},
  {"catalogNumber":73,"name":"Noxitide","types":["water","poison"],"rarity":"uncommon","description":"A wide manta-like purifier with glowing channels beneath its body. It concentrates contaminated water into dense removable toxin pearls.","stage":2,"totalStages":2,"lineId":"drizzlepod"},
  {"catalogNumber":74,"name":"Hearthwish","types":["fire","fairy"],"rarity":"uncommon","description":"A small warm-bodied spirit with waxy feather tufts. It appears near isolated camps and keeps one flame burning until travelers return.","stage":1,"totalStages":1,"lineId":"hearthwish"},
  {"catalogNumber":75,"name":"Asterolith","types":["rock","psychic"],"rarity":"epic","description":"A floating meteor-fragment creature surrounded by orbiting stone splinters. Its slow rotations subtly alter gravity across a small area.","stage":1,"totalStages":1,"lineId":"asterolith"},
  {"catalogNumber":76,"name":"Coldforge","types":["steel","ice"],"rarity":"uncommon","description":"A compact metallic beast with freezing bellows instead of lungs. It shapes brittle ice into durable tools by compressing it between chilled plates.","stage":1,"totalStages":1,"lineId":"coldforge"},
  {"catalogNumber":77,"name":"Tumblet","types":["normal","ground"],"rarity":"common","description":"A round prairie runner with a layered grass-fiber coat. It curls into a wheel and scatters stored seeds while rolling.","stage":1,"totalStages":1,"lineId":"tumblet"},
  {"catalogNumber":78,"name":"Glimmerguilt","types":["fairy","dark"],"rarity":"common","description":"A glossy masked creature that grows brighter after taking something unfairly. It cannot dim again until the object is returned.","stage":1,"totalStages":1,"lineId":"glimmerguilt"},
  {"catalogNumber":79,"name":"Eonbriar","types":["grass","dragon"],"rarity":"legendary","description":"An ancient branching dragon whose body resembles a moving root system. Its rare awakenings reconnect habitats separated by ruined land.","stage":1,"totalStages":1,"lineId":"eonbriar"},
  {"catalogNumber":80,"name":"Resonuckle","types":["fighting","psychic"],"rarity":"rare","description":"A disciplined cave guardian with tuning-fork forearms. It reads vibrations through stone and counters attacks with precisely timed resonant strikes.","stage":1,"totalStages":1,"lineId":"resonuckle"},
  {"catalogNumber":81,"name":"Quillop","types":["normal"],"rarity":"common","description":"A round grassland browser with flexible quills and an ink-dark nose. It arranges shed quills into simple markers around feeding grounds.","stage":1,"totalStages":2,"lineId":"quillop"},
  {"catalogNumber":82,"name":"Scribetail","types":["normal","psychic"],"rarity":"uncommon","description":"A poised long-tailed creature whose quills move without being touched. It records remembered paths as precise patterns in soil and bark.","stage":2,"totalStages":2,"lineId":"quillop"},
  {"catalogNumber":83,"name":"Brinibble","types":["water"],"rarity":"common","description":"A tiny shore-dweller inside a cork-like shell. It filters salt crystals from tide pools and stores fresh water for dry periods.","stage":1,"totalStages":2,"lineId":"brinibble"},
  {"catalogNumber":84,"name":"Steamvat","types":["water","fire"],"rarity":"uncommon","description":"A barrel-bodied coastal creature with copper vents and a sealed inner reservoir. It releases controlled steam clouds to shelter smaller monsters.","stage":2,"totalStages":2,"lineId":"brinibble"},
  {"catalogNumber":85,"name":"Frondle","types":["grass","bug"],"rarity":"common","description":"A leaf-folding insect with twiglike legs and a curious face. It repairs damaged foliage by stitching edges together with plant fiber.","stage":1,"totalStages":2,"lineId":"frondle"},
  {"catalogNumber":86,"name":"Thornloom","types":["grass","bug"],"rarity":"uncommon","description":"A tall weaving insect carrying a spindle of living thorn-vine. Its elaborate nest walls become safe nurseries for many forest species.","stage":2,"totalStages":2,"lineId":"frondle"},
  {"catalogNumber":87,"name":"Gravvel","types":["rock","ground"],"rarity":"common","description":"A low rocky burrower with a gravity-heavy belly and tiny digging claws. Loose stones settle into stable paths wherever it sleeps.","stage":1,"totalStages":2,"lineId":"gravvel"},
  {"catalogNumber":88,"name":"Faultusk","types":["rock","ground"],"rarity":"rare","description":"A plated subterranean giant with curved fault-line tusks. It senses deep pressure shifts and surfaces before earthquakes reach populated areas.","stage":2,"totalStages":2,"lineId":"gravvel"},
  {"catalogNumber":89,"name":"Arcwren","types":["electric","flying"],"rarity":"common","description":"A tiny darting flier with wire-thin feathers and a glowing throat. Flocks recharge by perching along naturally magnetic cliffs.","stage":1,"totalStages":2,"lineId":"arcwren"},
  {"catalogNumber":90,"name":"Stormscribe","types":["electric","flying"],"rarity":"uncommon","description":"A wide-winged weather bird whose charged feather tips draw symbols in clouds. Sailors study the patterns to anticipate dangerous fronts.","stage":2,"totalStages":2,"lineId":"arcwren"},
  {"catalogNumber":91,"name":"Smudgling","types":["dark","poison"],"rarity":"common","description":"A soft-bodied nocturnal creature that leaks harmless black dye when nervous. It hides among its own stains and feeds on toxic fungi.","stage":1,"totalStages":2,"lineId":"smudgling"},
  {"catalogNumber":92,"name":"Inkraith","types":["dark","ghost"],"rarity":"rare","description":"A fluid shadow spirit surrounded by drifting ink ribbons. It erases its outline completely before slipping through narrow cracks.","stage":2,"totalStages":2,"lineId":"smudgling"},
  {"catalogNumber":93,"name":"Snoflet","types":["ice","fairy"],"rarity":"common","description":"A delicate snowfield creature with bell-shaped ears and powdery feet. Its chiming calls keep separated groups together during blizzards.","stage":1,"totalStages":2,"lineId":"snoflet"},
  {"catalogNumber":94,"name":"Choralice","types":["ice","fairy"],"rarity":"uncommon","description":"A crystalline herd leader with layered resonant horns. Its harmonies shape blowing snow into temporary walls and sheltered pathways.","stage":2,"totalStages":2,"lineId":"snoflet"},
  {"catalogNumber":95,"name":"Rivetram","types":["steel","fighting"],"rarity":"uncommon","description":"A compact horned laborer held together by visible rotating rivets. It braces damaged structures and refuses to move until everyone is safe.","stage":1,"totalStages":1,"lineId":"rivetram"},
  {"catalogNumber":96,"name":"Mnemonax","types":["psychic","dragon"],"rarity":"rare","description":"A slender many-crested dragon whose scales display moving fragments of remembered places. It guards knowledge rather than territory.","stage":1,"totalStages":1,"lineId":"mnemonax"},
  {"catalogNumber":97,"name":"Charcoil","types":["fire","dragon"],"rarity":"uncommon","description":"A small serpentine furnace creature wrapped around a ceramic heat core. It carefully maintains incubation temperatures in volcanic nesting caves.","stage":1,"totalStages":1,"lineId":"charcoil"},
  {"catalogNumber":98,"name":"Mireglass","types":["poison","steel"],"rarity":"common","description":"A transparent marsh crawler with metallic organs visible beneath its shell. It traps pollutants inside replaceable glassy plates.","stage":1,"totalStages":1,"lineId":"mireglass"},
  {"catalogNumber":99,"name":"Sunspore","types":["grass","fire"],"rarity":"common","description":"A walking fungus with a warm golden cap and charcoal feet. It spreads only after controlled burns clear overcrowded undergrowth.","stage":1,"totalStages":1,"lineId":"sunspore"},
  {"catalogNumber":100,"name":"Hollowmorrow","types":["ghost","normal"],"rarity":"epic","description":"A pale featureless creature followed by echoes of movements it has not made yet. It appears shortly before major turning points.","stage":1,"totalStages":1,"lineId":"hollowmorrow"},
  {"catalogNumber":101,"name":"Aurevine","types":["grass","fairy"],"rarity":"legendary","description":"The leaf-antlered guardian of fair exchange. Its ivory crest unfurls living fronds that reveal imbalance, restore exhausted habitats, and curl protectively around honest traders.","stage":1,"totalStages":1,"lineId":"aurevine"},
  {"catalogNumber":102,"name":"Tempestyr","types":["electric","dragon"],"rarity":"legendary","description":"The lightning-antlered guardian of decisive exchange. Its teal body stores storm current while its golden crest flashes whenever a bargain will reshape the lives on both sides.","stage":1,"totalStages":1,"lineId":"tempestyr"},
] as MonsterConcept[];

const TYPE_PROFILE: Record<GameType, readonly [number, number, number, number]> = {
  normal: [2, 0, 0, 3], fire: [-2, 7, -3, 4], water: [4, 0, 4, -1],
  grass: [5, -1, 5, -2], electric: [-2, 4, -4, 9], ice: [0, 5, 1, -2],
  fighting: [3, 8, 1, 0], poison: [2, 1, 5, 1], ground: [5, 4, 5, -6],
  flying: [-2, 2, -4, 9], psychic: [-2, 5, -3, 4], bug: [0, 1, 2, 3],
  rock: [5, 5, 8, -9], ghost: [-2, 5, -2, 5], dragon: [5, 6, 4, 1],
  dark: [0, 6, -1, 4], steel: [4, 4, 10, -10], fairy: [2, 1, 3, 3],
};

const TYPE_TAG: Record<GameType, string> = {
  normal: "adaptable", fire: "heatborn", water: "aquatic", grass: "plantlike",
  electric: "charged", ice: "frostborn", fighting: "brawler", poison: "toxic",
  ground: "burrowing", flying: "aerial", psychic: "mystic", bug: "insectoid",
  rock: "mineral", ghost: "spirit", dragon: "draconic", dark: "nocturnal",
  steel: "armored", fairy: "fey",
};

const BREEDING_GROUP: Record<GameType, string> = {
  normal: "field", fire: "field", water: "aquatic", grass: "verdant",
  electric: "field", ice: "field", fighting: "field", poison: "amorphous",
  ground: "field", flying: "aerial", psychic: "mystic", bug: "insectoid",
  rock: "mineral", ghost: "spectral", dragon: "draconic", dark: "field",
  steel: "mineral", fairy: "fey",
};

const TYPE_SKILL_NAMES: Record<GameType, readonly [string, string]> = {
  normal: ["Steady Rush", "Resolute Cry"], fire: ["Ember Burst", "Furnace Arc"],
  water: ["Current Cut", "Undertow"], grass: ["Vine Snap", "Verdant Surge"],
  electric: ["Arc Jolt", "Storm Pulse"], ice: ["Frost Bite", "Whiteout"],
  fighting: ["Body Check", "Breaker Form"], poison: ["Venom Pin", "Miasma Wave"],
  ground: ["Dust Ram", "Fault Pulse"], flying: ["Gust Lance", "Skyfall"],
  psychic: ["Mind Ripple", "Thoughtbreak"], bug: ["Chitin Jab", "Swarm Signal"],
  rock: ["Stone Crash", "Cragfall"], ghost: ["Haunt Touch", "Dirge"],
  dragon: ["Scale Flare", "Ancient Roar"], dark: ["Shade Feint", "Nightfall"],
  steel: ["Alloy Bash", "Iron Resonance"], fairy: ["Gleam Dart", "Wonder Chorus"],
};

const TYPE_STATUS: Partial<Record<GameType, string>> = {
  fire: "burn", water: "wet", electric: "shock", ice: "freeze", fighting: "bleed",
  poison: "poison", rock: "stun", ghost: "fear", dark: "fear", psychic: "confusion",
  fairy: "sleep",
};

const TYPE_PASSIVE_STAT: Record<GameType, keyof Stats> = {
  normal: "hp", fire: "attack", water: "defense", grass: "hp", electric: "speed",
  ice: "defense", fighting: "attack", poison: "defense", ground: "hp",
  flying: "speed", psychic: "energy", bug: "speed", rock: "defense",
  ghost: "speed", dragon: "attack", dark: "attack", steel: "defense", fairy: "energy",
};

const RARITY_VALUE: Record<Rarity, number> = {
  common: 190, uncommon: 430, rare: 950, epic: 2400, legendary: 7200,
};
const RARITY_BUDGET: Record<Rarity, number> = {
  common: 230, uncommon: 260, rare: 295, epic: 330, legendary: 375,
};
const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 100, uncommon: 52, rare: 22, epic: 7, legendary: 2,
};

// Preserve the bespoke foundation identities already established before the full catalog was approved.
const SPECIES_OVERRIDES: Readonly<Record<string, Partial<SpeciesDefinition>>> = {
  mossveil: {
    tags: ["plantlike", "mollusk"], baseStats: { hp: 54, attack: 38, defense: 52, speed: 31, energy: 100 },
    traitPool: ["hardy", "patient"], breedingGroups: ["verdant"], skillPool: ["root-lash", "spore-veil"],
    passiveId: "dew-fed", habitats: ["greenreach-meadow"], baseMarketValue: 220,
  },
  canopyre: {
    tags: ["plantlike", "mollusk"], baseStats: { hp: 76, attack: 58, defense: 71, speed: 46, energy: 100 },
    traitPool: ["hardy", "patient"], breedingGroups: ["verdant"], skillPool: ["root-lash", "spore-veil", "canopy-surge"],
    passiveId: "living-canopy", habitats: ["greenreach-deepwood"], baseMarketValue: 610,
  },
  voltgrazer: {
    tags: ["beast", "herd"], baseStats: { hp: 62, attack: 55, defense: 45, speed: 68, energy: 100 },
    traitPool: ["keen-senses", "patient"], breedingGroups: ["field"], skillPool: ["static-prance", "grounding-hum"],
    passiveId: "storm-fed", habitats: ["stormpeak-foothills"], baseMarketValue: 430,
  },
  aurevine: {
    tags: ["crest-guardian", "plantlike", "fey", "serpentine"],
    skillPool: ["type-grass-basic", "type-fairy-basic", "type-grass-advanced", "crest-renewal"],
    passiveId: "keeper-of-balance", habitats: ["greenreach-deepwood"], baseMarketValue: 8800,
    obtainability: { wildCatchable: false, wildEncounterWeight: 0, breedable: false, directHatch: false, tradeable: false, auctionEligible: false },
  },
  tempestyr: {
    tags: ["crest-guardian", "charged", "draconic", "serpentine"],
    skillPool: ["type-electric-basic", "type-dragon-basic", "type-dragon-advanced", "crest-thunderbolt"],
    passiveId: "keeper-of-momentum", habitats: ["stormpeak-foothills"], baseMarketValue: 8800,
    obtainability: { wildCatchable: false, wildEncounterWeight: 0, breedable: false, directHatch: false, tradeable: false, auctionEligible: false },
  },
  rimehorn: { obtainability: { wildCatchable: false, wildEncounterWeight: 0, directHatch: false, tradeable: true, auctionEligible: true, evolutionOnly: true } },
  mournglade: { obtainability: { wildCatchable: false, wildEncounterWeight: 0, directHatch: false, tradeable: true, auctionEligible: true, evolutionOnly: true } },
  solvulture: { obtainability: { wildCatchable: false, wildEncounterWeight: 0, directHatch: false, tradeable: true, auctionEligible: true, evolutionOnly: true } },
};

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function habitatFor(types: readonly GameType[]): readonly string[] {
  const habitats = new Set<string>();
  for (const type of types) {
    if (["grass", "bug", "fairy", "normal", "fighting"].includes(type)) habitats.add("greenreach-meadow");
    if (["poison", "dark", "ghost", "psychic"].includes(type)) habitats.add("greenreach-deepwood");
    if (["electric", "flying", "rock", "ground", "steel", "ice", "dragon", "fire"].includes(type)) habitats.add("stormpeak-foothills");
    if (type === "ice") habitats.add("frostmarch-glacial-shelf");
    if (["rock", "ground"].includes(type)) habitats.add("stonehollow-quarries");
    if (["normal", "fairy", "psychic"].includes(type)) habitats.add("aurelia-riverbank");
    if (["steel", "fighting"].includes(type)) habitats.add("iron-dominion-slagfields");
    if (["water", "flying", "ice"].includes(type)) habitats.add("mistwater-reefs");
    if (["poison", "ghost", "dark", "bug"].includes(type)) habitats.add("mirefen-rotten-basin");
    if (["fire", "dragon"].includes(type)) habitats.add("dragonspine-molten-fangs");
    if (["rock", "fairy", "psychic"].includes(type)) habitats.add("crystal-depths-prism-chasm");
    if (["water", "ghost", "dark"].includes(type)) habitats.add("the-deep-drowned-bastion");
    if (["ghost", "psychic", "dragon"].includes(type)) habitats.add("rift-anomaly-nests");
    if (type === "water") habitats.add("greenreach-meadow");
  }
  return [...habitats];
}

function statBudget(concept: MonsterConcept): number {
  if (concept.totalStages === 1) return RARITY_BUDGET[concept.rarity];
  const stageBudget = concept.totalStages === 3
    ? [0, 220, 285, 360][concept.stage]
    : [0, 225, 310][concept.stage];
  return stageBudget + (concept.rarity === "rare" ? 10 : concept.rarity === "uncommon" ? 5 : 0);
}

function buildStats(concept: MonsterConcept): Stats {
  const profiles = concept.types.map((type) => TYPE_PROFILE[type]);
  const profile = [0, 1, 2, 3].map((index) => profiles.reduce((sum, values) => sum + values[index], 0) / profiles.length);
  const wobble = [
    (concept.catalogNumber % 5) - 2, ((concept.catalogNumber * 3) % 5) - 2,
    ((concept.catalogNumber * 7) % 5) - 2, ((concept.catalogNumber * 11) % 5) - 2,
  ];
  const weights = profile.map((value, index) => Math.max(0.55, 1 + (value + wobble[index]) / 32));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const budget = statBudget(concept);
  const values = weights.map((weight) => Math.round(budget * weight / totalWeight));
  const energyTypes = concept.types.filter((type) => ["psychic", "fairy", "electric", "ghost"].includes(type)).length;
  return { hp: values[0], attack: values[1], defense: values[2], speed: values[3], energy: 100 + energyTypes * 5 };
}

function skillIds(concept: MonsterConcept): readonly string[] {
  return [...new Set(concept.types.flatMap((type) => [`type-${type}-basic`, `type-${type}-advanced`]))];
}

function evolutionId(fromId: string, toId: string): string {
  return `${fromId}-to-${toId}`;
}

const conceptsByLine = new Map<string, MonsterConcept[]>();
for (const concept of MONSTER_CONCEPTS) {
  const line = conceptsByLine.get(concept.lineId) ?? [];
  line.push(concept);
  conceptsByLine.set(concept.lineId, line);
}

export const CATALOG_EVOLUTIONS: readonly EvolutionDefinition[] = [...conceptsByLine.values()].flatMap((line) =>
  line.slice(0, -1).map((from, index) => {
    const to = line[index + 1];
    return {
      id: evolutionId(slug(from.name), slug(to.name)),
      fromSpeciesId: slug(from.name), toSpeciesId: slug(to.name),
      requirements: {
        minLevel: from.stage === 1 ? 18 : 32,
        minPotential: slug(from.name) === "mossveil" ? 55 : from.stage === 1 ? 45 : 60,
      },
    };
  }),
);

export const CATALOG_SKILLS: readonly SkillDefinition[] = [...GAME_TYPES.flatMap((type) => {
  const [basicName, advancedName] = TYPE_SKILL_NAMES[type];
  const statusId = TYPE_STATUS[type];
  return [
    { id: `type-${type}-basic`, name: basicName, type, power: 42, energyCost: 20, cooldown: 0, target: "enemy" as const, ...(statusId ? { statusId, statusChance: 0.12 } : {}) },
    { id: `type-${type}-advanced`, name: advancedName, type, power: 67, energyCost: 45, cooldown: 2, target: "enemy" as const, ...(statusId ? { statusId, statusChance: 0.28 } : {}) },
  ];
}),
  { id: "crest-renewal", name: "Crest Renewal", type: "grass", power: 0, energyCost: 55, cooldown: 3, target: "all-allies", healingPower: 34, cleanseCount: 1 },
  { id: "crest-thunderbolt", name: "Crest Thunderbolt", type: "electric", power: 82, energyCost: 55, cooldown: 3, target: "enemy", statusId: "shock", statusChance: 0.4 },
];

export const CATALOG_PASSIVES: readonly PassiveDefinition[] = [...GAME_TYPES.map((type) => ({
  id: `affinity-${type}`, name: `${type[0].toUpperCase() + type.slice(1)} Affinity`,
  statModifiers: { [TYPE_PASSIVE_STAT[type]]: 0.07 },
})),
  { id: "keeper-of-balance", name: "Keeper of Balance", statModifiers: { defense: 0.1 }, teamShieldPercent: 0.08 },
  { id: "keeper-of-momentum", name: "Keeper of Momentum", statModifiers: { attack: 0.08, speed: 0.08 } },
];

export const CATALOG_SPECIES: readonly SpeciesDefinition[] = MONSTER_CONCEPTS.map((concept) => {
  const id = slug(concept.name);
  const line = conceptsByLine.get(concept.lineId) ?? [];
  const next = line.find((candidate) => candidate.stage === concept.stage + 1);
  const generated: SpeciesDefinition = {
    id, catalogNumber: concept.catalogNumber, name: concept.name, description: concept.description,
    evolutionStage: concept.stage, evolutionLineLength: concept.totalStages, types: concept.types,
    tags: [...new Set(concept.types.map((type) => TYPE_TAG[type]))], rarity: concept.rarity,
    baseStats: buildStats(concept), geneCaps: { hp: 31, attack: 31, defense: 31, speed: 31 },
    traitPool: concept.types.includes("electric") || concept.types.includes("flying")
      ? ["keen-senses", "hardy"]
      : concept.types.includes("rock") || concept.types.includes("steel") || concept.types.includes("ground")
        ? ["patient", "hardy"] : ["hardy", "patient", "keen-senses"],
    breedingGroups: [...new Set(concept.types.map((type) => BREEDING_GROUP[type]))],
    skillPool: skillIds(concept), passiveId: `affinity-${concept.types[0]}`,
    evolutionIds: next ? [evolutionId(id, slug(next.name))] : [], habitats: habitatFor(concept.types),
    baseMarketValue: Math.round(RARITY_VALUE[concept.rarity] * (1 + (concept.stage - 1) * 0.28)),
    artId: `monsters/${id}/${id}--base--idle--right`,
  };
  return { ...generated, ...SPECIES_OVERRIDES[id] };
});

export function speciesPoolForZone(zoneId: string): readonly { speciesId: string; weight: number }[] {
  return CATALOG_SPECIES.filter((species) => species.habitats.includes(zoneId) && species.obtainability?.wildCatchable !== false).map((species) => ({
    speciesId: species.id, weight: species.obtainability?.wildEncounterWeight ?? Math.max(1, Math.round(RARITY_WEIGHT[species.rarity] / species.evolutionStage)),
  }));
}
