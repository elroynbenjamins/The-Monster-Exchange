const species = window.MONSTERDEX_SPECIES ?? [];
const artPath = (entry, kind) => `../../assets/pixel/monsterdex/${kind === "portrait" ? "portraits" : "cards"}/${String(entry.catalogNumber).padStart(3,"0")}--${entry.id}--${kind}.png`;
const stored = JSON.parse(localStorage.getItem("monsterdex-demo-records") ?? "{}");
const records = new Map(Object.entries(stored));
for (let number = 1; number <= 15; number++) if (!records.has(String(number))) records.set(String(number), number <= 3 ? "caught" : "seen");
const elements = Object.fromEntries([...document.querySelectorAll("[id]")].map((node) => [node.id, node]));
let visible = species;
let selectedNumber = 1;

function status(number) { return records.get(String(number)) ?? "unknown"; }
function saveRecords() { localStorage.setItem("monsterdex-demo-records", JSON.stringify(Object.fromEntries(records))); }
function setCardArt(node, entry, kind = "card") {
  node.style.setProperty("--art", `url('${artPath(entry, kind)}')`);
}
function updateProgress() {
  const caught = species.filter(({ catalogNumber }) => status(catalogNumber) === "caught").length;
  elements["progress-text"].textContent = `${caught} / ${species.length} collected`;
  elements["progress-bar"].style.width = `${caught / Math.max(1, species.length) * 100}%`;
}
function renderGrid() {
  const query = elements.search.value.trim().toLowerCase();
  const type = elements["type-filter"].value;
  const rarity = elements["rarity-filter"].value;
  const record = elements["status-filter"].value;
  visible = species.filter((entry) => !query || entry.name.toLowerCase().includes(query) || String(entry.catalogNumber).includes(query))
    .filter((entry) => !type || entry.types.includes(type))
    .filter((entry) => !rarity || entry.rarity === rarity)
    .filter((entry) => !record || status(entry.catalogNumber) === record);
  elements["result-count"].textContent = `${visible.length} ${visible.length === 1 ? "entry" : "entries"}`;
  elements["card-grid"].replaceChildren(...visible.map((entry) => {
    const button = document.createElement("button");
    button.className = "entry";
    button.dataset.status = status(entry.catalogNumber);
    button.setAttribute("aria-label", `#${entry.catalogNumber} ${entry.name}`);
    const art = document.createElement("div"); art.className = "card-art"; setCardArt(art, entry);
    const ribbon = document.createElement("span"); ribbon.className = "status-ribbon"; ribbon.textContent = status(entry.catalogNumber);
    button.append(art, ribbon);
    button.addEventListener("click", () => openDetail(entry.catalogNumber));
    return button;
  }));
  updateProgress();
}
function openDetail(number) {
  const entry = species.find((item) => item.catalogNumber === number); if (!entry) return;
  selectedNumber = number;
  setCardArt(elements["detail-card"], entry); setCardArt(elements["combat-card"], entry, "portrait");
  elements["detail-number"].textContent = `Catalog #${String(number).padStart(3,"0")}`;
  elements["detail-name"].textContent = entry.name;
  elements["detail-description"].textContent = entry.description;
  elements["detail-rarity"].textContent = entry.rarity;
  elements["detail-region"].textContent = entry.habitats[0]?.replaceAll("-"," ") ?? "Unknown";
  elements["detail-stage"].textContent = `${entry.evolutionStage} / ${entry.evolutionLineLength}`;
  elements["detail-status"].textContent = status(number);
  elements["detail-types"].replaceChildren(...entry.types.map((type) => { const chip=document.createElement("span"); chip.className="type-chip"; chip.textContent=type; return chip; }));
  elements["status-action"].textContent = status(number) === "unknown" ? "Mark as seen" : status(number) === "seen" ? "Mark as caught" : "Reset record";
  elements["combat-name"].textContent = entry.name;
  elements["combat-panel"].hidden = true;
  if (!elements["detail-dialog"].open) elements["detail-dialog"].showModal();
}
function step(direction) {
  const list = visible.length ? visible : species;
  const index = list.findIndex(({ catalogNumber }) => catalogNumber === selectedNumber);
  openDetail(list[(index + direction + list.length) % list.length].catalogNumber);
}
elements["status-action"].addEventListener("click", () => { const current=status(selectedNumber); records.set(String(selectedNumber), current === "unknown" ? "seen" : current === "seen" ? "caught" : "unknown"); saveRecords(); renderGrid(); openDetail(selectedNumber); });
elements["combat-preview"].addEventListener("click", () => { elements["combat-panel"].hidden = !elements["combat-panel"].hidden; });
elements["close-detail"].addEventListener("click", () => elements["detail-dialog"].close());
elements["previous-entry"].addEventListener("click", () => step(-1)); elements["next-entry"].addEventListener("click", () => step(1));
elements["detail-dialog"].addEventListener("click", (event) => { if (event.target === elements["detail-dialog"]) elements["detail-dialog"].close(); });
document.addEventListener("keydown", (event) => { if (!elements["detail-dialog"].open) return; if (event.key === "ArrowLeft") step(-1); if (event.key === "ArrowRight") step(1); });
for (const id of ["search","type-filter","rarity-filter","status-filter"]) elements[id].addEventListener("input", renderGrid);
elements["theme-toggle"].addEventListener("click", () => { const next=document.documentElement.dataset.theme === "light" ? "dark" : "light"; document.documentElement.dataset.theme=next; localStorage.setItem("monsterdex-theme",next); });
document.documentElement.dataset.theme = localStorage.getItem("monsterdex-theme") ?? "dark";
const types = [...new Set(species.flatMap((entry) => entry.types))].sort();
elements["type-filter"].append(...types.map((type) => { const option=document.createElement("option"); option.value=type; option.textContent=type; return option; }));
renderGrid();
