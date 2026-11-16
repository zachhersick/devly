// App state: every record in memory as signals, saved to IndexedDB on each
// change. Pages read the computed views below and write through the actions.
import { computed, signal } from "@preact/signals-core";
import { PROBLEMS } from "@/content/index.js";
import { attemptId, dailyProblem, dateKey, dayId, emptyAttempt, finishStep, rateCard } from "./model.js";
import * as db from "./db.js";

export const DEFAULT_SETTINGS = { id: "settings", kind: "settings", theme: "system", tint: "blue", keepAwake: true };

export const records = signal(new Map());
export const loaded = signal(false);

// The local calendar day, refreshed when the app comes back to the foreground
// so a phone left open overnight rolls over to the next problem.
export const today = signal(dateKey());
if (typeof document !== "undefined") {
  const refresh = () => {
    const key = dateKey();
    if (key !== today.value) today.value = key;
  };
  document.addEventListener("visibilitychange", refresh);
  setInterval(refresh, 60_000);
}

const ofKind = (kind) => computed(() => [...records.value.values()].filter((record) => record.kind === kind));

export const days = ofKind("day");
export const attempts = ofKind("attempt");
const cardStateList = ofKind("card");
export const cardStates = computed(() => new Map(cardStateList.value.map((state) => [state.cardId, state])));
export const settings = computed(() => ({ ...DEFAULT_SETTINGS, ...(records.value.get("settings") || {}) }));

export const todayProblemId = computed(() => dailyProblem(PROBLEMS, days.value, attempts.value, today.value));
export const todayRecord = computed(() => records.value.get(dayId(today.value)) || null);

export function attemptFor(problemId) {
  return records.value.get(attemptId(problemId)) || emptyAttempt(problemId, today.value);
}

export async function load() {
  const list = await db.loadRecords();
  records.value = new Map(list.map((record) => [record.id, record]));
  loaded.value = true;
}

export async function saveMany(list) {
  const stamped = list.map((record) => ({ ...record, updatedAt: Math.max(Date.now(), (records.value.get(record.id)?.updatedAt || 0) + 1) }));
  const next = new Map(records.value);
  for (const record of stamped) next.set(record.id, record);
  records.value = next;
  await db.putRecords(stamped);
  return stamped;
}

export async function save(record) {
  return (await saveMany([record]))[0];
}

// Pins today's problem so it can't change partway through the day.
export function pinToday() {
  if (todayRecord.value || !todayProblemId.value) return;
  save({ id: dayId(today.value), kind: "day", date: today.value, problemId: todayProblemId.value, done: [] });
}

/** @param {string} problemId @param {(draft: any) => void} change */
export function updateAttempt(problemId, change) {
  const draft = structuredClone(attemptFor(problemId));
  change(draft);
  return save(draft);
}

/** Marks a step done on the problem and logs it as today's activity for the streak. */
export function finish(problemId, step) {
  const attempt = finishStep(attemptFor(problemId), step, today.value);
  const day = todayRecord.value || { id: dayId(today.value), kind: "day", date: today.value, problemId: todayProblemId.value, done: [] };
  const mark = `${problemId}:${step}`;
  return saveMany([attempt, day.done.includes(mark) ? day : { ...day, done: [...day.done, mark] }]);
}

export function rate(cardId, rating) {
  return save(rateCard(cardStates.value.get(cardId), cardId, rating, today.value));
}

export function saveSettings(change) {
  return save({ ...settings.value, ...change, id: "settings", kind: "settings" });
}

// ---------- backups ----------

export function exportData() {
  return { app: "devly", version: 1, exportedAt: new Date().toISOString(), records: [...records.value.values()] };
}

/** From an exported backup: newer copies replace local ones. */
export async function importRecords(list) {
  const valid = list.filter((record) => record && typeof record.id === "string" && typeof record.kind === "string" && Number.isFinite(record.updatedAt));
  const accepted = valid.filter((record) => record.updatedAt > (records.value.get(record.id)?.updatedAt || 0));
  if (!accepted.length) return 0;
  const next = new Map(records.value);
  for (const record of accepted) next.set(record.id, record);
  records.value = next;
  await db.putRecords(accepted);
  return accepted.length;
}

export async function resetProgress() {
  const keep = records.value.get("settings");
  await db.clearRecords();
  records.value = new Map(keep ? [["settings", keep]] : []);
  if (keep) await db.putRecords([keep]);
}
