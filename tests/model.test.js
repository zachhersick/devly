import { test } from "node:test";
import assert from "node:assert/strict";
import { accuracyByTag, addDays, cardDeck, dailyProblem, designScore, emptyAttempt, finishStep, longestStreak, quizPosition, rateCard, streak, validateContent } from "../src/lib/model.js";

const problems = ["a", "b", "c"].map((id) => ({ id, quiz: [{ answer: 0, tag: "api" }, { answer: 1, tag: "caching" }], cardIds: [`${id}-card`] }));

test("addDays crosses months and years", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(addDays("2026-03-08", 1), "2026-03-09");
});

test("dailyProblem keeps the same pick all day", () => {
  const days = [{ date: "2026-10-26", problemId: "b" }];
  assert.equal(dailyProblem(problems, days, [], "2026-10-26"), "b");
});

test("dailyProblem moves to the next unseen problem in order", () => {
  assert.equal(dailyProblem(problems, [], [], "2026-10-26"), "a");
  const days = [{ date: "2026-10-25", problemId: "a" }];
  assert.equal(dailyProblem(problems, days, [], "2026-10-26"), "b");
  const attempts = [{ problemId: "b", completedOn: "2026-10-01" }];
  assert.equal(dailyProblem(problems, days, attempts, "2026-10-26"), "c");
});

test("dailyProblem repeats the oldest once the bank is used up", () => {
  const days = [
    { date: "2026-10-23", problemId: "b" },
    { date: "2026-10-24", problemId: "a" },
    { date: "2026-10-25", problemId: "c" }
  ];
  assert.equal(dailyProblem(problems, days, [], "2026-10-26"), "b");
});

test("streak counts back from today, or from yesterday before today's first step", () => {
  const days = ["2026-10-23", "2026-10-24", "2026-10-25"].map((date) => ({ date, done: ["a:quiz"] }));
  assert.equal(streak(days, "2026-10-26"), 3);
  assert.equal(streak([...days, { date: "2026-10-26", done: ["a:cards"] }], "2026-10-26"), 4);
  assert.equal(streak(days, "2026-10-27"), 0);
  assert.equal(streak([{ date: "2026-10-26", done: [] }], "2026-10-26"), 0);
  assert.equal(longestStreak([...days, { date: "2026-10-01", done: ["x"] }]), 3);
});

test("finishStep completes the problem once every step is done", () => {
  let attempt = emptyAttempt("a", "2026-10-26");
  for (const step of ["quiz", "diagram", "design"]) attempt = finishStep(attempt, step, "2026-10-26");
  assert.equal(attempt.completedOn, undefined);
  attempt = finishStep(attempt, "cards", "2026-10-27");
  assert.equal(attempt.completedOn, "2026-10-27");
  assert.equal(finishStep(attempt, "cards", "2026-10-28").completedOn, "2026-10-27");
});

test("quizPosition resumes at the first unanswered question", () => {
  const attempt = emptyAttempt("a", "2026-10-26");
  assert.equal(quizPosition(attempt, problems[0]), 0);
  attempt.quiz.answers = [2];
  assert.equal(quizPosition(attempt, problems[0]), 1);
  attempt.quiz.answers = [2, 1];
  assert.equal(quizPosition(attempt, problems[0]), 2);
});

test("designScore is the share of key points ticked", () => {
  assert.equal(designScore([0, 2, 2], ["a", "b", "c", "d"]), 50);
  assert.equal(designScore([], []), 0);
});

test("accuracyByTag tallies answered questions by tag", () => {
  const index = new Map(problems.map((p) => [p.id, p]));
  const rows = accuracyByTag([{ problemId: "a", quiz: { answers: [0, 0] } }, { problemId: "b", quiz: { answers: [0] } }], index);
  assert.deepEqual(rows.map((r) => [r.tag, r.right, r.total, r.pct]), [["api", 2, 2, 100], ["caching", 0, 1, 0]]);
});

test("rateCard climbs boxes and resets on again", () => {
  const first = rateCard(undefined, "x", "good", "2026-10-26");
  assert.deepEqual([first.box, first.due], [1, "2026-10-27"]);
  const second = rateCard(first, "x", "good", "2026-10-27");
  assert.deepEqual([second.box, second.due], [2, "2026-10-30"]);
  const miss = rateCard(second, "x", "again", "2026-10-30");
  assert.deepEqual([miss.box, miss.due, miss.reviews], [1, "2026-10-30", 3]);
});

test("cardDeck puts the problem's cards first, then due reviews", () => {
  const cards = ["a-card", "b-card", "c-card"].map((id) => ({ id, front: id, back: id }));
  const states = new Map([
    ["b-card", { due: "2026-10-20" }],
    ["c-card", { due: "2026-11-20" }]
  ]);
  assert.deepEqual(cardDeck(problems[0], cards, states, "2026-10-26").map((c) => c.id), ["a-card", "b-card"]);
});

test("validateContent flags broken problems", () => {
  const bad = { id: "x", title: "X", prompt: "p", difficulty: "easy", tags: ["nope"], requirements: { functional: ["f"] }, quiz: [{ choices: ["a", "b"], answer: 5, why: "w", tag: "api" }], diagram: { nodes: [{ id: "n", kind: "db", x: 10, y: 10 }], edges: [{ from: "n", to: "m" }], steps: [] }, modelAnswer: [{}], keyPoints: ["k"], cardIds: ["missing"] };
  const errors = validateContent([bad], []);
  for (const fragment of ["unknown tag nope", "answer out of range", "unknown node", "never added", "unknown card missing", "at least 4"]) assert.ok(errors.some((e) => e.includes(fragment)), fragment);
});
