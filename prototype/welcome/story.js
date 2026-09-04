export const chapters = [
  { label: "A world of possibilities", title: "Every great journey begins with a bond.", text: "Across Ardenfall, monsters shape the land and the lives of those who call it home. Some race through the forests. Others sleep beneath stone or follow the gathering storms.", note: "This is their world. And now, it is yours.", image: "/assets/pixel/maps/continents/continent--exchange-network--world-map.png", alt: "The lands and routes of the Monster Exchange world" },
  { label: "Your first destination · Greenreach", title: "All roads start somewhere.", text: "Yours leads to Greenreach: a land of fields, woodland paths, and new beginnings. Beyond its borders lie unfamiliar cities and monsters you have yet to meet.", note: "For now, one small corner of the world is enough.", image: "/assets/pixel/maps/regions/region--greenreach--map.png", alt: "Forests and settlements of Greenreach" },
  { label: "Arrival · Willowmere", title: "Welcome to Willowmere.", text: "The market town is already awake. Traders gather at the Exchange, researchers prepare for the field, and challengers make their way to the arena. Somewhere among these streets, your own story is waiting.", note: "You arrive with a simple ambition: build a team you believe in.", image: "/assets/pixel/maps/cities/city--willowmere--map.png", alt: "Willowmere, your starting town in Greenreach" },
  { label: "The beginning of your story", title: "A partner. A team. A name of your own.", text: "Your journey will be about more than winning battles. Learn what makes each monster different. Discover where it belongs. Decide what kind of manager you want to become.", note: "Your first chapter begins in Willowmere.", image: "/assets/pixel/maps/cities/city--willowmere--map.png", alt: "The streets of Willowmere await your arrival" }
];
export const INTRO_KEY = "monster-exchange.intro.v1";
export function readProgress(storage) {
  try {
    const value = JSON.parse(storage.getItem(INTRO_KEY));
    if (value?.version === 1 && Number.isInteger(value.chapter) && value.chapter >= 0 && value.chapter < chapters.length && typeof value.completed === "boolean") return value;
  } catch { /* Storage can be unavailable or contain an older, invalid record. */ }
  return { version: 1, chapter: 0, completed: false };
}
export function writeProgress(storage, chapter, completed = false) {
  try { storage.setItem(INTRO_KEY, JSON.stringify({ version: 1, chapter, completed })); return true; }
  catch { return false; }
}
