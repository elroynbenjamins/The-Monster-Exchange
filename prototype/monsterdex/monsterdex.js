const species = window.MONSTERDEX_SPECIES ?? [];
const artPath = (entry, kind) => `../../assets/pixel/monsterdex/${kind === "portrait" ? "portraits" : "cards"}/${String(entry.catalogNumber).padStart(3,"0")}--${entry.id}--${kind}.png`;
const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; } };
const records = new Map(Object.entries(readJson("monsterdex-demo-records", {})));
const favorites = new Set(readJson("monsterdex-favorites", []));
const preferences = { favoritesOnly:false, revealUnknown:false, compact:false, ...readJson("monsterdex-preferences", {}) };
for (let number = 1; number <= 15; number++) if (!records.has(String(number))) records.set(String(number), number <= 3 ? "caught" : "seen");

const elements = Object.fromEntries([...document.querySelectorAll("[id]")].map((node) => [node.id, node]));
const rarityOrder = { legendary:5, epic:4, rare:3, uncommon:2, common:1 };
const recordOrder = { caught:3, seen:2, unknown:1 };
const regionPrefixes = ["iron-dominion", "mistwater-coast", "crystal-depths", "the-deep", "greenreach", "stormpeak", "frostmarch", "stonehollow", "aurelia", "mirefen", "dragonspine", "rift"];
let visible = species;
let selectedNumber = 1;

function status(number) { return records.get(String(number)) ?? "unknown"; }
function region(entry) {
  const habitat = entry.habitats[0] ?? "unknown";
  return regionPrefixes.find((prefix) => habitat.startsWith(prefix)) ?? habitat.split("-")[0];
}
function titleCase(value) { return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function saveCollection() {
  localStorage.setItem("monsterdex-demo-records", JSON.stringify(Object.fromEntries(records)));
  localStorage.setItem("monsterdex-favorites", JSON.stringify([...favorites]));
  localStorage.setItem("monsterdex-preferences", JSON.stringify(preferences));
}
function setCardArt(node, entry, kind = "card") { node.style.setProperty("--art", `url('${artPath(entry, kind)}')`); }
function family(entry) {
  const first = entry.catalogNumber - entry.evolutionStage + 1;
  return species.filter(({ catalogNumber }) => catalogNumber >= first && catalogNumber < first + entry.evolutionLineLength);
}
function syncPreferenceControls() {
  elements["favorites-filter"].setAttribute("aria-pressed", String(preferences.favoritesOnly));
  elements["spoiler-toggle"].setAttribute("aria-pressed", String(preferences.revealUnknown));
  elements["density-toggle"].setAttribute("aria-pressed", String(preferences.compact));
  elements["favorites-filter"].textContent = preferences.favoritesOnly ? "★ Showing favorites" : "★ Favorites only";
  elements["spoiler-toggle"].textContent = preferences.revealUnknown ? "◉ Unknown art revealed" : "◉ Reveal unknown art";
  elements["density-toggle"].textContent = preferences.compact ? "▦ Comfortable cards" : "▦ Compact cards";
  document.body.classList.toggle("reveal-unknown", preferences.revealUnknown);
  document.body.classList.toggle("compact", preferences.compact);
}
function updateProgress() {
  const seen = species.filter(({ catalogNumber }) => status(catalogNumber) !== "unknown").length;
  const caught = species.filter(({ catalogNumber }) => status(catalogNumber) === "caught").length;
  const nextTarget = Math.min(species.length, Math.max(10, Math.ceil((caught + 1) / 10) * 10));
  elements["progress-text"].textContent = `${caught} / ${species.length} collected`;
  elements["progress-bar"].style.width = `${caught / Math.max(1, species.length) * 100}%`;
  elements["milestone-text"].textContent = caught === species.length ? "Collection complete" : `${nextTarget - caught} until the ${nextTarget}-monster milestone`;
  elements["collection-summary"].textContent = `${seen} seen · ${caught} caught · ${favorites.size} ${favorites.size === 1 ? "favorite" : "favorites"}`;
}
function compareEntries(a, b) {
  const sort = elements["sort-order"].value;
  if (sort === "name") return a.name.localeCompare(b.name) || a.catalogNumber - b.catalogNumber;
  if (sort === "rarity") return rarityOrder[b.rarity] - rarityOrder[a.rarity] || a.catalogNumber - b.catalogNumber;
  if (sort === "record") return recordOrder[status(b.catalogNumber)] - recordOrder[status(a.catalogNumber)] || a.catalogNumber - b.catalogNumber;
  return a.catalogNumber - b.catalogNumber;
}
function renderGrid() {
  const query = elements.search.value.trim().toLowerCase();
  const type = elements["type-filter"].value;
  const rarity = elements["rarity-filter"].value;
  const record = elements["status-filter"].value;
  const selectedRegion = elements["region-filter"].value;
  visible = species.filter((entry) => !query || entry.name.toLowerCase().includes(query) || String(entry.catalogNumber).padStart(3,"0").includes(query))
    .filter((entry) => !type || entry.types.includes(type))
    .filter((entry) => !rarity || entry.rarity === rarity)
    .filter((entry) => !record || status(entry.catalogNumber) === record)
    .filter((entry) => !selectedRegion || region(entry) === selectedRegion)
    .filter((entry) => !preferences.favoritesOnly || favorites.has(entry.catalogNumber))
    .sort(compareEntries);
  elements["result-count"].textContent = `${visible.length} ${visible.length === 1 ? "entry" : "entries"}`;
  const cards = visible.map((entry) => {
    const button = document.createElement("article");
    button.className = "entry";
    button.dataset.status = status(entry.catalogNumber);
    const art = document.createElement("div"); art.className = "card-art"; setCardArt(art, entry);
    const ribbon = document.createElement("span"); ribbon.className = "status-ribbon"; ribbon.textContent = status(entry.catalogNumber);
    const openButton = document.createElement("button"); openButton.className = "entry-open"; openButton.type = "button";
    openButton.setAttribute("aria-label", `#${entry.catalogNumber} ${entry.name}, ${status(entry.catalogNumber)}`);
    const star = document.createElement("button"); star.className = "favorite-star"; star.type = "button"; star.textContent = favorites.has(entry.catalogNumber) ? "★" : "☆";
    star.setAttribute("aria-label", `${favorites.has(entry.catalogNumber) ? "Remove" : "Add"} ${entry.name} ${favorites.has(entry.catalogNumber) ? "from" : "to"} favorites`);
    star.addEventListener("click", (event) => { event.stopPropagation(); toggleFavorite(entry.catalogNumber); });
    openButton.addEventListener("click", () => openDetail(entry.catalogNumber));
    button.append(art, ribbon, openButton, star);
    return button;
  });
  if (!cards.length) { const empty=document.createElement("p"); empty.className="empty-state"; empty.textContent="No monsters match these filters."; cards.push(empty); }
  elements["card-grid"].replaceChildren(...cards);
  updateProgress();
}
function renderEvolutionFamily(entry) {
  elements["evolution-family"].replaceChildren(...family(entry).map((member) => {
    const button=document.createElement("button"); button.className="evolution-member"; button.setAttribute("aria-current", String(member.catalogNumber === entry.catalogNumber));
    const art=document.createElement("span"); art.className="portrait-art"; setCardArt(art,member,"portrait");
    const copy=document.createElement("span"); copy.innerHTML=`<strong>${member.name}</strong><small>Stage ${member.evolutionStage}</small>`;
    button.append(art,copy); button.addEventListener("click",()=>openDetail(member.catalogNumber)); return button;
  }));
}
function openDetail(number, updateHash = true) {
  const entry = species.find((item) => item.catalogNumber === number); if (!entry) return;
  selectedNumber = number;
  setCardArt(elements["detail-card"], entry); setCardArt(elements["combat-card"], entry, "portrait");
  elements["detail-number"].textContent = `Catalog #${String(number).padStart(3,"0")}`;
  elements["detail-name"].textContent = entry.name;
  elements["detail-description"].textContent = entry.description;
  elements["detail-rarity"].textContent = entry.rarity;
  elements["detail-region"].textContent = titleCase(region(entry));
  elements["detail-stage"].textContent = `${entry.evolutionStage} / ${entry.evolutionLineLength}`;
  elements["detail-status"].textContent = status(number);
  elements["detail-types"].replaceChildren(...entry.types.map((type) => { const chip=document.createElement("span"); chip.className="type-chip"; chip.textContent=type; return chip; }));
  elements["status-action"].textContent = status(number) === "unknown" ? "Mark as seen" : status(number) === "seen" ? "Mark as caught" : "Reset record";
  elements["favorite-action"].textContent = favorites.has(number) ? "★ Remove favorite" : "☆ Add favorite";
  elements["favorite-action"].setAttribute("aria-pressed", String(favorites.has(number)));
  elements["combat-name"].textContent = entry.name;
  elements["combat-panel"].hidden = true;
  renderEvolutionFamily(entry);
  if (updateHash) history.replaceState(null, "", `#monster-${String(number).padStart(3,"0")}`);
  if (!elements["detail-dialog"].open) elements["detail-dialog"].showModal();
}
function toggleFavorite(number) {
  if (favorites.has(number)) favorites.delete(number); else favorites.add(number);
  saveCollection(); renderGrid();
  if (elements["detail-dialog"].open && number === selectedNumber) openDetail(number, false);
}
function step(direction) {
  const list = visible.length ? visible : species;
  const currentIndex = list.findIndex(({ catalogNumber }) => catalogNumber === selectedNumber);
  const index = currentIndex < 0 ? 0 : (currentIndex + direction + list.length) % list.length;
  openDetail(list[index].catalogNumber);
}
function closeDetail() { elements["detail-dialog"].close(); history.replaceState(null, "", `${location.pathname}${location.search}`); }

elements["status-action"].addEventListener("click", () => { const current=status(selectedNumber); records.set(String(selectedNumber), current === "unknown" ? "seen" : current === "seen" ? "caught" : "unknown"); saveCollection(); renderGrid(); openDetail(selectedNumber, false); });
elements["favorite-action"].addEventListener("click", () => toggleFavorite(selectedNumber));
elements["combat-preview"].addEventListener("click", () => { elements["combat-panel"].hidden = !elements["combat-panel"].hidden; });
elements["close-detail"].addEventListener("click", closeDetail);
elements["previous-entry"].addEventListener("click", () => step(-1)); elements["next-entry"].addEventListener("click", () => step(1));
elements["detail-dialog"].addEventListener("click", (event) => { if (event.target === elements["detail-dialog"]) closeDetail(); });
elements["detail-dialog"].addEventListener("close", () => { if (/^#monster-/.test(location.hash)) history.replaceState(null, "", `${location.pathname}${location.search}`); });
document.addEventListener("keydown", (event) => { if (!elements["detail-dialog"].open) return; if (event.key === "ArrowLeft") step(-1); if (event.key === "ArrowRight") step(1); });
for (const id of ["search","type-filter","rarity-filter","status-filter","region-filter","sort-order"]) elements[id].addEventListener("input", renderGrid);
elements["favorites-filter"].addEventListener("click", () => { preferences.favoritesOnly=!preferences.favoritesOnly; saveCollection(); syncPreferenceControls(); renderGrid(); });
elements["random-entry"].addEventListener("click", () => { const pool=visible.length ? visible : species; if (pool.length) openDetail(pool[Math.floor(Math.random()*pool.length)].catalogNumber); });
elements["spoiler-toggle"].addEventListener("click", () => { preferences.revealUnknown=!preferences.revealUnknown; saveCollection(); syncPreferenceControls(); });
elements["density-toggle"].addEventListener("click", () => { preferences.compact=!preferences.compact; saveCollection(); syncPreferenceControls(); });
elements["theme-toggle"].addEventListener("click", () => { const next=document.documentElement.dataset.theme === "light" ? "dark" : "light"; document.documentElement.dataset.theme=next; localStorage.setItem("monsterdex-theme",next); });

document.documentElement.dataset.theme = localStorage.getItem("monsterdex-theme") ?? "dark";
const types = [...new Set(species.flatMap((entry) => entry.types))].sort();
elements["type-filter"].append(...types.map((type) => { const option=document.createElement("option"); option.value=type; option.textContent=type; return option; }));
const regions = [...new Set(species.map(region))].sort();
elements["region-filter"].append(...regions.map((value) => { const option=document.createElement("option"); option.value=value; option.textContent=titleCase(value); return option; }));
syncPreferenceControls(); renderGrid();
const linkedNumber = Number(location.hash.match(/^#monster-(\d{1,3})$/)?.[1]);
if (linkedNumber) openDetail(linkedNumber, false);
window.addEventListener("hashchange", () => {
  const number = Number(location.hash.match(/^#monster-(\d{1,3})$/)?.[1]);
  if (number) openDetail(number, false);
});
