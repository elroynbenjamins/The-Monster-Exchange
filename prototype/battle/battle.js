import { TrainingBattle, content, SPRITE_SPECIES_ALIASES } from "./runtime/game/training-battle.js";

const root = "/assets/pixel/battle/monster-exchange-battle-sprites-v1";
const $ = selector => document.querySelector(selector);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const aliases = SPRITE_SPECIES_ALIASES;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let session, busy = false;
let spriteIds = new Map();
const saveKey = "monster-exchange.training.v1";
let changedElsewhere = false;
function persist() {
  try {
    localStorage.setItem(saveKey, session.save());
    $("#saveStatus").textContent = "Battle saved on this device · resumes automatically";
  } catch {
    $("#saveStatus").textContent = "Saving unavailable. You can play, but progress may be lost when you leave.";
  }
}
window.addEventListener("storage", event => {
  if (event.key !== saveKey && event.key !== null) return;
  changedElsewhere = true;
  $("#saveStatus").textContent = "Battle changed in another tab. Reload to use the latest save.";
  controls();
});

function pose(unit, name) {
  const image = $(`#${unit.side}Sprite`);
  image.src = `${root}/sprites/256/${spriteIds.get(unit.species.id)}/${name}.png`;
  image.alt = `${unit.species.name}, ${name}`;
}
function render(state) {
  for (const unit of state.units) {
    const side = unit.side;
    $(`#${side}Name`).textContent = unit.species.name;
    $(`#${side}Types`).textContent = unit.species.types.join(" · ");
    $(`#${side}Health`).style.width = `${100 * unit.hp / unit.maxHp}%`;
    $(`#${side}HpCopy`).textContent = `${unit.hp}/${unit.maxHp} HP · ${unit.energy} energy · ${unit.shield} shield`;
    $(`#${side}Effects`).textContent = unit.statuses.map(status => `${status.id} (${status.remainingActions})`).join(" · ");
    $(`.fighter.${side}`).dataset.type = unit.species.types.join(" ");
    $(`.fighter.${side}`).classList.toggle("defeated", unit.hp <= 0);
    pose(unit, unit.hp > 0 ? "idle" : "defeated");
  }
}
function particles(side, type) {
  if (reducedMotion.matches) return;
  const box = $(`#${side}Particles`);
  box.replaceChildren();
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement("i");
    particle.className = `particle ${type === "grass" ? "leaf" : type === "fairy" ? "flower" : ""}`;
    particle.style.setProperty("--angle", `${i / 10}turn`);
    particle.style.setProperty("--distance", `${40 + i * 4}px`);
    box.append(particle);
  }
  setTimeout(() => box.replaceChildren(), 700);
}
function controls() {
  for (const id of ["resetBattle", "playerSelect", "enemySelect"]) $(`#${id}`).disabled = busy || changedElsewhere;
  $("#skillActions").replaceChildren();
  if (!session) return;
  for (const action of session.actions) {
    const button = document.createElement("button");
    const skill = action.kind === "skill" && content.skills.find(skill => skill.id === action.skillId);
    button.textContent = session.label(action) + (skill ? ` · ${skill.energyCost} E` : "");
    button.disabled = busy || changedElsewhere;
    button.addEventListener("click", () => run(action));
    $("#skillActions").append(button);
  }
}
async function animate(frame) {
  const actor = frame.before.units.find(unit => unit.id === frame.action.actorId);
  const fighter = $(`.fighter.${actor.side}`);
  $("#battleLog").textContent = `${actor.species.name}: ${session.label(frame.action)}`;
  pose(actor, "attack"); fighter.classList.add("attacking");
  await wait(reducedMotion.matches ? 0 : 320);
  fighter.classList.remove("attacking"); render(frame.after);
  const events = frame.after.events.slice(frame.before.events.length);
  for (const unit of frame.after.units) {
    const damaged = events.some(event => ["battle.damage", "battle.status-damage"].includes(event.type) && event.payload.targetId === unit.id);
    if (!damaged || unit.hp === 0) continue;
    pose(unit, "hit"); $(`.fighter.${unit.side}`).classList.add("hit");
    particles(unit.side, actor.species.types[0]);
  }
  const powerful = events.some(event => event.type === "battle.damage" && Number(event.payload.damage) >= frame.before.units.find(unit => unit.id === event.payload.targetId).maxHp * .25);
  $("#battlefield").classList.toggle("shake", powerful && !reducedMotion.matches);
  await wait(reducedMotion.matches ? 0 : 360);
  document.querySelectorAll(".fighter").forEach(fighter => fighter.classList.remove("hit"));
  $("#battlefield").classList.remove("shake"); render(frame.after);
}
async function enemyTurns() {
  if (changedElsewhere) return;
  const frames = session.advanceEnemy();
  persist(); // Commit all responses before any asynchronous visual playback.
  for (const frame of frames) await animate(frame);
}
function resultMessage() {
  $("#battleLog").textContent = session.state.result === "ongoing" ? "Your turn — choose a move." : session.state.result === "player-victory" ? "Victory! Training complete. No campaign rewards awarded." : "Defeat. Try a different monster or move.";
}
async function run(action) {
  // Lock the entire turn, including enemy responses and animation delays.
  if (busy || changedElsewhere) return;
  busy = true; controls();
  try {
    const frame = session.step(action);
    persist();
    await animate(frame); await enemyTurns(); resultMessage();
  }
  catch (error) { $("#battleLog").textContent = `Battle error: ${error.message}. Start a new battle to retry.`; }
  finally { busy = false; controls(); }
}
async function start() {
  if (busy || changedElsewhere) return;
  busy = true; controls();
  try {
    session = new TrainingBattle($("#playerSelect").value, $("#enemySelect").value);
    document.querySelectorAll(".fighter").forEach(fighter => fighter.classList.remove("hit", "attacking", "defeated"));
    render(session.state); await enemyTurns(); resultMessage();
  } catch (error) { $("#battleLog").textContent = `Unable to start: ${error.message}`; }
  finally { busy = false; controls(); }
}
try {
  const response = await fetch(`${root}/sprites.json`);
  if (!response.ok) throw new Error("Sprite manifest could not load");
  const manifest = await response.json();
  spriteIds = new Map(manifest.lines.flatMap(line => line.monsters).map(monster => [aliases[monster.id] ?? monster.id, monster.id]));
  const available = content.species.filter(species => spriteIds.has(species.id)).sort((a,b) => a.name.localeCompare(b.name));
  for (const side of ["player", "enemy"]) {
    const select = $(`#${side}Select`);
    for (const species of available) select.add(new Option(`${species.name} — ${species.types.join("/")}`, species.id));
    select.value = side === "player" ? "sprigbara" : "cindlet";
  }
  // Selection is staged; only the explicit button can replace a saved match.
  $("#resetBattle").addEventListener("click", () => {
    $("#restartDialog").returnValue = "cancel";
    $("#restartDialog").showModal();
  });
  $("#restartDialog").addEventListener("close", () => {
    if ($("#restartDialog").returnValue === "restart") start();
  });
  let saved;
  try { saved = localStorage.getItem(saveKey); }
  catch { /* start() reports unavailable storage without blocking play */ }
  if (saved !== null && saved !== undefined) {
    try {
      session = TrainingBattle.restore(saved);
      if (session.state.units.some(unit => !spriteIds.has(unit.species.id))) throw new Error("Saved monster art is unavailable");
      for (const unit of session.state.units) $(`#${unit.side}Select`).value = unit.species.id;
      busy = true; controls(); render(session.state);
      await enemyTurns(); resultMessage();
      if (!changedElsewhere && $("#saveStatus").textContent.startsWith("Battle saved")) $("#saveStatus").textContent = "Saved battle resumed · progress saves after every move";
    } catch (error) {
      session = undefined;
      $("#battleLog").textContent = "Unable to resume this battle. Start a new battle to play.";
      $("#saveStatus").textContent = `${error.message}. Existing save kept until you confirm a new battle.`;
    } finally { busy = false; controls(); }
  } else await start();
} catch (error) { $("#battleLog").textContent = `${error.message}. Reload to retry.`; }
