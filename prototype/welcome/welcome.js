import { chapters, readProgress, writeProgress } from "./story.js";
const $ = selector => document.querySelector(selector);
let storage;
try { storage = localStorage; } catch { /* Intro remains usable without device storage. */ }
let progress = readProgress(storage);
let chapter = progress.completed ? 0 : progress.chapter;
$("#continue").hidden = !progress.completed;
function save(completed = progress.completed) {
  progress = { version: 1, chapter, completed };
  $("#saveNotice").textContent = writeProgress(storage, chapter, completed)
    ? "Story progress saves on this device."
    : "Device saving is unavailable. You can still continue.";
}
function render(focus = false) {
  const scene = chapters[chapter];
  $("#sceneArt").src = scene.image;
  $("#sceneArt").alt = scene.alt;
  $("#sceneLabel").textContent = scene.label;
  $("#chapterCount").textContent = `PROLOGUE · ${chapter + 1} / ${chapters.length}`;
  $("#storyTitle").textContent = scene.title;
  $("#storyText").textContent = scene.text;
  $("#storyNote").textContent = scene.note;
  $("#back").disabled = chapter === 0;
  $("#next").textContent = chapter === chapters.length - 1 ? "Enter Willowmere →" : chapter === 0 ? "Begin your story →" : "Continue →";
  $("#progress").replaceChildren(...chapters.map((_, index) => {
    const dot = document.createElement("span");
    dot.className = index <= chapter ? "filled" : "";
    dot.setAttribute("aria-hidden", "true");
    return dot;
  }));
  $("#progress").setAttribute("aria-label", `Chapter ${chapter + 1} of ${chapters.length}`);
  if (focus) $("#storyTitle").focus({ preventScroll: true });
}
$("#back").addEventListener("click", () => { if (chapter > 0) { chapter--; save(); render(true); } });
$("#next").addEventListener("click", () => {
  if (chapter < chapters.length - 1) { chapter++; save(); render(true); }
  else { save(true); location.assign("/prototype/world-map/city-map.html?city=willowmere"); }
});
$("#skip").addEventListener("click", () => save(true));
render();
if (!storage) $("#saveNotice").textContent = "Device saving is unavailable. You can still continue.";
