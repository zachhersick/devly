// Write (or dictate) your own design, then compare it with the model answer
// and tick the key points you covered.
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card, FadeIn, Section } from "@/components/kit";
import { PracticeFrame, Requirements, useAttempt, type Problem } from "@/components/problem";
import { Button } from "@/components/ui/button";
import { PROBLEM_INDEX } from "@/content/index.js";
import { haptic } from "@/lib/haptics.js";
import { designScore } from "@/lib/model.js";
import { back } from "@/lib/router.js";
import { finish, updateAttempt } from "@/lib/store.js";
import { cn } from "@/lib/utils";
import { useWakeLock } from "@/lib/wake";

const PLACEHOLDER = "Requirements → estimates → API → data model → high-level design → bottlenecks.\n\nBullet points are fine. Tap the mic on your keyboard to dictate.";

export function DesignPage({ id }: { id: string }) {
  const problem = PROBLEM_INDEX.get(id) as Problem;
  const attempt = useAttempt(id);
  const [draft, setDraft] = useState(attempt.design.draft);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useWakeLock();

  // Save the draft shortly after typing stops, and right away when leaving.
  const latest = useRef(draft);
  latest.current = draft;
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (latest.current !== attempt.design.draft) updateAttempt(id, (d) => (d.design.draft = latest.current));
    },
    []
  );
  const edit = (value: string) => {
    setDraft(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => updateAttempt(id, (d) => (d.design.draft = value)), 500);
  };

  const revealed = Boolean(attempt.design.revealed);
  const checked = attempt.design.checked;
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  return (
    <PracticeFrame
      actions={
        revealed ? (
          <Button
            className="flex-1"
            onClick={() => {
              finish(id, "design");
              back(`problem/${id}`);
            }}
            size="lg"
          >
            Finish · {designScore(checked, problem.keyPoints)}%
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => updateAttempt(id, (d) => ((d.design.draft = draft), (d.design.revealed = true)))} size="lg">
            Compare with model answer
          </Button>
        )
      }
      problemId={id}
      title="Your design"
    >
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-[15px] leading-relaxed">{problem.prompt}</p>
        <Requirements problem={problem} />
      </Card>
      <div className="flex flex-col gap-2">
        <textarea
          aria-label="Your design"
          className="surface min-h-56 w-full resize-y rounded-2xl p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring/50"
          onChange={(event) => edit(event.target.value)}
          placeholder={PLACEHOLDER}
          value={draft}
        />
        <span className="px-1 text-right text-[12px] text-muted-foreground tabular">{words} words · saved on this device</span>
      </div>

      {revealed ? (
        <>
          <FadeIn>
            <Section footer="Tick each point your design covered." title="Key points">
              <div className="flex flex-col gap-2">
                {problem.keyPoints.map((point, i) => {
                  const on = checked.includes(i);
                  return (
                    <button
                      aria-pressed={on}
                      className={cn("surface flex min-h-13 items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] leading-snug transition-colors", on && "border-success/60 bg-success/10")}
                      key={point}
                      onClick={() => {
                        haptic(6);
                        updateAttempt(id, (d) => (d.design.checked = on ? d.design.checked.filter((n: number) => n !== i) : [...d.design.checked, i]));
                      }}
                      type="button"
                    >
                      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 border-input", on && "border-success bg-success text-white")}>{on ? <Check className="size-3.5" strokeWidth={2.5} /> : null}</span>
                      {point}
                    </button>
                  );
                })}
              </div>
            </Section>
          </FadeIn>
          <FadeIn delay={0.05}>
            <Section title="Model answer">
              <Card className="flex flex-col gap-4 p-5">
                {problem.modelAnswer.map((part) => (
                  <div key={part.heading}>
                    <h3 className="mb-1 text-[15px] font-medium">{part.heading}</h3>
                    <p className="text-[15px] leading-relaxed text-foreground/85">{part.body}</p>
                  </div>
                ))}
              </Card>
            </Section>
          </FadeIn>
        </>
      ) : null}
    </PracticeFrame>
  );
}
