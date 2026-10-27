// The bundled content. Problems run in file-name order (the two-digit prefix
// is the daily order); card files are merged into one deck.
import { validateContent } from "@/lib/model.js";

const problemFiles = import.meta.glob("./problems/*.js", { eager: true, import: "default" });
const cardFiles = import.meta.glob("./cards/*.js", { eager: true, import: "default" });

export const PROBLEMS = Object.keys(problemFiles).sort().map((path) => problemFiles[path]);
export const PROBLEM_INDEX = new Map(PROBLEMS.map((problem) => [problem.id, problem]));
export const CARDS = Object.keys(cardFiles).sort().flatMap((path) => cardFiles[path]);
export const CARD_INDEX = new Map(CARDS.map((card) => [card.id, card]));

if (import.meta.env.DEV) {
  const errors = validateContent(PROBLEMS, CARDS);
  if (errors.length) console.warn(`Devly content has ${errors.length} problem(s):\n${errors.join("\n")}`);
}
