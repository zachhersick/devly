// Pure logic: dates, the daily pick, streaks, card review timing, scoring and
// content checks. No DOM or storage here, so tests import it directly.

export const STEPS = ["quiz", "diagram", "design", "cards"];

export const TAGS = ["requirements", "estimation", "api", "data-model", "caching", "sharding", "replication", "consistency", "queues", "load-balancing", "storage", "search", "realtime", "security", "reliability", "observability", "scaling"];

export const NODE_KINDS = ["client", "lb", "gateway", "service", "cache", "db", "queue", "storage", "cdn", "worker", "search", "external"];

export const DIAGRAM_SIZE = { width: 360, height: 480 };

// ---------- dates (local calendar days as "YYYY-MM-DD") ----------

export function dateKey(time = Date.now()) {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + days, 12).getTime());
}

export function daysBetween(a, b) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

// ---------- the daily problem ----------

export const dayId = (key) => `day:${key}`;
export const attemptId = (problemId) => `attempt:${problemId}`;
export const cardStateId = (cardId) => `card:${cardId}`;

/**
 * Today's problem id. Once a day has a problem it keeps it. Otherwise it's the
 * first problem in bank order that no earlier day was given and that you
 * haven't finished; when the bank runs out it repeats the one given longest ago.
 */
export function dailyProblem(problems, days, attempts, today) {
  if (!problems.length) return null;
  const pinned = days.find((day) => day.date === today)?.problemId;
  if (pinned && problems.some((p) => p.id === pinned)) return pinned;
  const given = new Map();
  for (const day of days) if (day.date < today && (!given.has(day.problemId) || given.get(day.problemId) < day.date)) given.set(day.problemId, day.date);
  const finished = new Set(attempts.filter((a) => a.completedOn).map((a) => a.problemId));
  const fresh = problems.find((p) => !given.has(p.id) && !finished.has(p.id));
  if (fresh) return fresh.id;
  return [...problems].sort((a, b) => (given.get(a.id) || "").localeCompare(given.get(b.id) || ""))[0].id;
}

// ---------- streaks ----------

/** Days in a row with at least one finished step, ending today (or yesterday if today has none yet). */
export function streak(days, today) {
  const active = new Set(days.filter((day) => day.done?.length).map((day) => day.date));
  let cursor = active.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (active.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function longestStreak(days) {
  const dates = [...new Set(days.filter((day) => day.done?.length).map((day) => day.date))].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < dates.length; i++) {
    run = i && daysBetween(dates[i - 1], dates[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

// ---------- attempts ----------

const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isStrings = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** Whether a record from a backup has the shape this app writes; anything else is skipped on import. */
export function validRecord(record) {
  if (!isObject(record) || typeof record.id !== "string" || !Number.isFinite(record.updatedAt)) return false;
  if (record.kind === "settings") return record.id === "settings";
  if (record.kind === "day") return isDate(record.date) && record.id === dayId(record.date) && typeof record.problemId === "string" && isStrings(record.done);
  if (record.kind === "attempt")
    return (
      typeof record.problemId === "string" &&
      record.id === attemptId(record.problemId) &&
      isStrings(record.done) &&
      (record.quiz === undefined || (isObject(record.quiz) && Array.isArray(record.quiz.answers))) &&
      (record.design === undefined || (isObject(record.design) && typeof (record.design.draft ?? "") === "string" && Array.isArray(record.design.checked ?? []))) &&
      (record.cards === undefined || (isObject(record.cards) && isStrings(record.cards.rated ?? [])))
    );
  if (record.kind === "card") return typeof record.cardId === "string" && record.id === cardStateId(record.cardId) && Number.isInteger(record.box) && record.box >= 0 && record.box < BOX_DAYS.length && isDate(record.due);
  return false;
}

export function emptyAttempt(problemId, today) {
  return { id: attemptId(problemId), kind: "attempt", problemId, startedOn: today, quiz: { answers: [] }, diagram: { step: 0 }, design: { draft: "", checked: [] }, cards: { rated: [] }, done: [] };
}

export function stepsDone(attempt) {
  return STEPS.filter((step) => attempt?.done?.includes(step));
}

/** The attempt with `step` marked done; sets completedOn when all four are. */
export function finishStep(attempt, step, today) {
  if (attempt.done.includes(step)) return attempt;
  const done = [...attempt.done, step];
  return { ...attempt, done, completedOn: STEPS.every((s) => done.includes(s)) ? attempt.completedOn || today : attempt.completedOn };
}

/** Where the quiz resumes: the first unanswered question. */
export function quizPosition(attempt, problem) {
  const answers = attempt?.quiz?.answers || [];
  const next = problem.quiz.findIndex((_, i) => answers[i] === undefined || answers[i] === null);
  return next === -1 ? problem.quiz.length : next;
}

export function quizScore(attempt, problem) {
  const answers = attempt?.quiz?.answers || [];
  const right = problem.quiz.filter((item, i) => answers[i] === item.answer).length;
  return { right, total: problem.quiz.length };
}

export function designScore(checked, keyPoints) {
  if (!keyPoints.length) return 0;
  return Math.round((new Set(checked).size / keyPoints.length) * 100);
}

/** First-try quiz accuracy grouped by question tag, most practiced first. */
export function accuracyByTag(attempts, problemIndex) {
  const tally = new Map();
  for (const attempt of attempts) {
    const problem = problemIndex.get(attempt.problemId);
    if (!problem) continue;
    problem.quiz.forEach((item, i) => {
      const answer = attempt.quiz?.answers?.[i];
      if (answer === undefined || answer === null) return;
      const row = tally.get(item.tag) || { tag: item.tag, right: 0, total: 0 };
      row.total += 1;
      if (answer === item.answer) row.right += 1;
      tally.set(item.tag, row);
    });
  }
  return [...tally.values()].map((row) => ({ ...row, pct: Math.round((row.right / row.total) * 100) })).sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag));
}

// ---------- concept cards (Leitner boxes) ----------

export const BOX_DAYS = [0, 1, 3, 7, 14, 30];

/** Next state after rating a card: "good" moves it up a box, "again" back to box 1 and due today. */
export function rateCard(state, cardId, rating, today) {
  const box = rating === "good" ? Math.min((state?.box || 0) + 1, BOX_DAYS.length - 1) : 1;
  return { id: cardStateId(cardId), kind: "card", cardId, box, due: rating === "good" ? addDays(today, BOX_DAYS[box]) : today, reviews: (state?.reviews || 0) + 1 };
}

export function isDue(state, today) {
  return !state || state.due <= today;
}

/** The deck for a problem: its own cards first, then up to `extra` other cards due for review. */
export function cardDeck(problem, cards, states, today, extra = 4) {
  const index = new Map(cards.map((card) => [card.id, card]));
  const own = problem.cardIds.map((id) => index.get(id)).filter(Boolean);
  const ownIds = new Set(own.map((card) => card.id));
  const review = cards
    .filter((card) => !ownIds.has(card.id) && states.get(card.id) && isDue(states.get(card.id), today))
    .sort((a, b) => states.get(a.id).due.localeCompare(states.get(b.id).due))
    .slice(0, extra);
  return [...own, ...review];
}

// ---------- content checks ----------

/** Problems with the reasons they're malformed; an empty list means the bank is fine. */
export function validateContent(problems, cards) {
  const errors = [];
  const cardIds = new Set();
  for (const card of cards) {
    if (!card?.id || !card.front || !card.back) errors.push(`card ${card?.id}: needs id, front and back`);
    else if (cardIds.has(card.id)) errors.push(`card ${card.id}: duplicate id`);
    cardIds.add(card?.id);
  }
  const ids = new Set();
  for (const p of problems) {
    const at = (msg) => errors.push(`${p?.id || "?"}: ${msg}`);
    if (!p?.id) {
      at("missing id");
      continue;
    }
    if (ids.has(p.id)) at("duplicate id");
    ids.add(p.id);
    for (const key of ["title", "prompt"]) if (typeof p[key] !== "string" || !p[key]) at(`missing ${key}`);
    if (!["easy", "medium", "hard"].includes(p.difficulty)) at("difficulty must be easy, medium or hard");
    for (const tag of p.tags || []) if (!TAGS.includes(tag)) at(`unknown tag ${tag}`);
    if (!p.requirements?.functional?.length) at("needs functional requirements");
    if (!Array.isArray(p.quiz) || p.quiz.length < 4) at("needs at least 4 quiz questions");
    (p.quiz || []).forEach((item, i) => {
      if (!Array.isArray(item.choices) || item.choices.length < 2) at(`quiz ${i + 1}: needs choices`);
      else if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.choices.length) at(`quiz ${i + 1}: answer out of range`);
      if (!item.why) at(`quiz ${i + 1}: missing why`);
      if (!TAGS.includes(item.tag)) at(`quiz ${i + 1}: unknown tag ${item.tag}`);
    });
    const nodes = new Map((p.diagram?.nodes || []).map((node) => [node.id, node]));
    if (!nodes.size) at("diagram needs nodes");
    for (const node of nodes.values()) {
      if (!NODE_KINDS.includes(node.kind)) at(`node ${node.id}: unknown kind ${node.kind}`);
      if (!(node.x >= 0 && node.x <= DIAGRAM_SIZE.width && node.y >= 0 && node.y <= DIAGRAM_SIZE.height)) at(`node ${node.id}: off the canvas`);
    }
    for (const edge of p.diagram?.edges || []) if (!nodes.has(edge.from) || !nodes.has(edge.to)) at(`edge ${edge.from}→${edge.to}: unknown node`);
    const added = (p.diagram?.steps || []).flatMap((step) => step.add || []);
    for (const id of added) if (!nodes.has(id)) at(`diagram step adds unknown node ${id}`);
    if (new Set(added).size !== added.length) at("diagram adds a node twice");
    for (const id of nodes.keys()) if (!added.includes(id)) at(`node ${id} is never added`);
    if (!p.modelAnswer?.length) at("needs a model answer");
    if (!p.keyPoints?.length) at("needs key points");
    for (const id of p.cardIds || []) if (!cardIds.has(id)) at(`unknown card ${id}`);
  }
  return errors;
}
