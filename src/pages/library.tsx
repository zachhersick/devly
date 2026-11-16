// Every problem in daily order, to work ahead or redo old ones, plus the full
// concept deck.
import { Check, ChevronDown, Layers } from "lucide-react";
import { useState } from "react";
import { Card, Chip, List, Page, Row, Section, TopBar } from "@/components/kit";
import { Difficulty, SetTicks, tagLabel, type Problem } from "@/components/problem";
import { CARDS, PROBLEMS } from "@/content/index.js";
import { BOX_DAYS, isDue, stepsDone } from "@/lib/model.js";
import { attempts, cardStates, today, todayProblemId } from "@/lib/store.js";
import { useValue } from "@/lib/use-signal";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "easy", "medium", "hard", "unfinished"] as const;

export function Library() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const progress = new Map(useValue(attempts).map((a: any) => [a.problemId, a]));
  const todayId = useValue(todayProblemId);
  const list = (PROBLEMS as Problem[]).filter((p) => (filter === "all" ? true : filter === "unfinished" ? !progress.get(p.id)?.completedOn : p.difficulty === filter));
  const finished = (PROBLEMS as Problem[]).filter((p) => progress.get(p.id)?.completedOn).length;
  return (
    <Page>
      <TopBar subtitle={`${finished} of ${PROBLEMS.length} problems finished`} title="Library" />
      <List>
        <Row chevron href="#/deck" icon={Layers} subtitle={`${CARDS.length} concepts`} title="Concept deck" />
      </List>
      <Section title="Problems">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((item) => (
            <Chip className="capitalize" key={item} on={filter === item} onClick={() => setFilter(item)}>
              {item}
            </Chip>
          ))}
        </div>
        <List>
          {list.map((p) => {
            const attempt = progress.get(p.id);
            const n = stepsDone(attempt).length;
            return (
              <Row chevron href={`#/problem/${p.id}`} key={p.id} subtitle={p.id === todayId ? "Today's problem" : p.tags.map(tagLabel).join(" · ")} title={p.title}>
                <span className="flex shrink-0 items-center gap-3">
                  {attempt?.completedOn ? <Check className="size-5 text-success" strokeWidth={2.5} /> : n ? <SetTicks done={n} /> : null}
                  <Difficulty level={p.difficulty} />
                </span>
              </Row>
            );
          })}
        </List>
      </Section>
    </Page>
  );
}

export function Deck() {
  const states = useValue(cardStates);
  const day = useValue(today);
  const [open, setOpen] = useState<string | null>(null);
  const learned = CARDS.filter((card: any) => (states.get(card.id)?.box || 0) >= 3).length;
  const due = CARDS.filter((card: any) => states.get(card.id) && isDue(states.get(card.id), day)).length;
  return (
    <Page>
      <TopBar backLabel="Library" backTo="library" subtitle={`${learned} learned · ${due} due for review`} title="Concept deck" />
      <div className="flex flex-col gap-2">
        {CARDS.map((card: any) => {
          const box = states.get(card.id)?.box || 0;
          const on = open === card.id;
          return (
            <Card key={card.id}>
              <button aria-expanded={on} className="flex w-full items-center gap-3 px-4 py-4 text-left" onClick={() => setOpen(on ? null : card.id)} type="button">
                <span className="flex-1 text-[15px] font-medium">{card.front}</span>
                <span aria-label={`Box ${box} of ${BOX_DAYS.length - 1}`} className="flex gap-0.5">
                  {BOX_DAYS.slice(1).map((_, i) => (
                    <span className={cn("size-1.5 rounded-full", i < box ? "bg-primary" : "bg-muted")} key={i} />
                  ))}
                </span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", on && "rotate-180")} strokeWidth={2} />
              </button>
              {on ? <p className="px-4 pb-4 text-[14px] leading-relaxed text-foreground/85">{card.back}</p> : null}
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
