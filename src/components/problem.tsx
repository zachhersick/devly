// A problem's overview (brief, tags and the four practice steps) and the frame
// every practice step shares: compact header, progress and a bottom action bar.
import { Check, ChevronDown, Layers, ListChecks, Network, PenLine } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Card, List, Row, Section, TopBar, AnimatePresence, motion } from "@/components/kit";
import { CARDS } from "@/content/index.js";
import { cardDeck, designScore, quizPosition, quizScore } from "@/lib/model.js";
import { attemptFor, cardStates, records, today } from "@/lib/store.js";
import { useValue } from "@/lib/use-signal";
import { cn } from "@/lib/utils";

export type Problem = {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  minutes: number;
  tags: string[];
  prompt: string;
  requirements: { functional: string[]; nonFunctional: string[] };
  quiz: { q: string; choices: string[]; answer: number; why: string; tag: string }[];
  diagram: import("@/components/diagram-view").Diagram;
  modelAnswer: { heading: string; body: string }[];
  keyPoints: string[];
  cardIds: string[];
};

export type Attempt = {
  id: string;
  problemId: string;
  quiz: { answers: (number | null)[] };
  diagram: { step: number };
  design: { draft: string; checked: number[]; revealed?: boolean };
  cards: { rated: string[] };
  done: string[];
  completedOn?: string;
};

const DIFFICULTY = {
  easy: "bg-success/15 text-success",
  medium: "bg-pr/15 text-pr",
  hard: "bg-destructive/15 text-destructive"
};

export function Difficulty({ level }: { level: Problem["difficulty"] }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize", DIFFICULTY[level])}>{level}</span>;
}

export const tagLabel = (tag: string) => tag.replace(/-/g, " ");

export function useAttempt(problemId: string): Attempt {
  useValue(records);
  return attemptFor(problemId) as Attempt;
}

export function Brief({ problem }: { problem: Problem }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="tint-glow flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Difficulty level={problem.difficulty} />
        <span>about {problem.minutes} min</span>
      </div>
      <h2 className="text-[24px] leading-tight font-semibold tracking-[-0.02em]">{problem.title}</h2>
      <p className="text-[15.5px] leading-relaxed text-foreground/85">{problem.prompt}</p>
      <div className="flex flex-wrap gap-1.5">
        {problem.tags.map((tag) => (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground capitalize" key={tag}>
            {tagLabel(tag)}
          </span>
        ))}
      </div>
      <button aria-expanded={open} className="-mx-1 mt-1 flex items-center gap-1 self-start rounded-full px-1 text-[14px] font-medium text-primary" onClick={() => setOpen(!open)} type="button">
        Requirements
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} strokeWidth={2.6} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div animate={{ height: "auto", opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }}>
            <Requirements problem={problem} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

export function Requirements({ problem }: { problem: Problem }) {
  return (
    <div className="grid gap-3 text-[14.5px] leading-snug">
      {(
        [
          ["Functional", problem.requirements.functional],
          ["Non-functional", problem.requirements.nonFunctional]
        ] as const
      ).map(([title, items]) =>
        items?.length ? (
          <div key={title}>
            <p className="mb-1 text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}

/** The four practice steps with how far along each one is. */
export function Steps({ problem }: { problem: Problem }) {
  const attempt = useAttempt(problem.id);
  const states = useValue(cardStates);
  const day = useValue(today);
  const answered = Math.min(quizPosition(attempt, problem), problem.quiz.length);
  const score = quizScore(attempt, problem);
  const deckSize = cardDeck(problem, CARDS, states, day).length;
  const done = (step: string) => attempt.done.includes(step);
  const check = <Check className="size-5 text-success" strokeWidth={3} />;
  const steps = [
    { step: "quiz", icon: ListChecks, title: "Quiz", subtitle: done("quiz") ? `${score.right} of ${score.total} right` : answered ? `${answered} of ${problem.quiz.length} answered` : `${problem.quiz.length} quick questions` },
    { step: "diagram", icon: Network, title: "Diagram walkthrough", subtitle: done("diagram") ? "Walked through" : attempt.diagram.step ? `Step ${attempt.diagram.step + 1} of ${problem.diagram.steps.length}` : `Build it in ${problem.diagram.steps.length} steps` },
    { step: "design", icon: PenLine, title: "Your design", subtitle: done("design") ? `${designScore(attempt.design.checked, problem.keyPoints)}% of key points` : attempt.design.draft ? "Draft saved" : "Sketch it, then compare" },
    { step: "cards", icon: Layers, title: "Concept cards", subtitle: done("cards") ? "Reviewed" : `${deckSize} cards` }
  ];
  return (
    <Section title="Steps" action={`${attempt.done.length} of 4 done`}>
      <List>
        {steps.map((item) => (
          <Row chevron={!done(item.step)} href={`#/${item.step}/${problem.id}`} icon={item.icon} iconClass={done(item.step) ? "bg-success/15 text-success" : undefined} key={item.step} subtitle={item.subtitle} title={item.title}>
            {done(item.step) ? check : null}
          </Row>
        ))}
      </List>
    </Section>
  );
}

/** Thin segmented progress, one segment per item. */
export function Progress({ total, current, marks }: { total: number; current: number; marks?: ("right" | "wrong" | null)[] }) {
  return (
    <div aria-label={`${Math.min(current + 1, total)} of ${total}`} className="flex gap-1" role="progressbar" aria-valuemax={total} aria-valuenow={current}>
      {Array.from({ length: total }, (_, i) => (
        <span
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            marks?.[i] === "right" ? "bg-success" : marks?.[i] === "wrong" ? "bg-destructive" : i < current ? "bg-primary" : i === current ? "bg-primary/45" : "bg-muted"
          )}
          key={i}
        />
      ))}
    </div>
  );
}

/** Shared layout for practice steps: content scrolls, actions stay under your thumb. */
export function PracticeFrame({ title, problemId, children, actions }: { title: string; problemId: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">
      <TopBar backLabel="Problem" backTo={`problem/${problemId}`} large={false} title={title} />
      <div className="flex flex-1 flex-col gap-5 pt-2 pb-40">{children}</div>
      {actions ? (
        <div className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="pointer-events-auto mx-auto flex w-full max-w-xl gap-3 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-6 pb-4">{actions}</div>
        </div>
      ) : null}
    </div>
  );
}
