import { Flame, PartyPopper } from "lucide-react";
import { useEffect } from "react";
import { Card, Page, TopBar, FadeIn } from "@/components/kit";
import { Brief, Steps, useAttempt, type Problem } from "@/components/problem";
import { Button } from "@/components/ui/button";
import { PROBLEM_INDEX } from "@/content/index.js";
import { streak } from "@/lib/model.js";
import { days, pinToday, today, todayProblemId } from "@/lib/store.js";
import { useValue } from "@/lib/use-signal";

export function StreakPill() {
  const count = streak(useValue(days), useValue(today));
  return (
    <span aria-label={`${count} day streak`} className="flex h-8 items-center gap-1 rounded-full bg-pr/15 px-3 text-[14px] font-semibold text-pr tabular">
      <Flame className="size-4" strokeWidth={2.4} />
      {count}
    </span>
  );
}

export function Today() {
  const id = useValue(todayProblemId);
  const day = useValue(today);
  useEffect(() => pinToday(), [day]);
  const problem = id ? (PROBLEM_INDEX.get(id) as Problem) : null;
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <Page>
      <TopBar eyebrow={date} title="Today" trailing={<StreakPill />} />
      {problem ? <TodayProblem problem={problem} /> : <p className="text-muted-foreground">No problems bundled yet.</p>}
    </Page>
  );
}

function TodayProblem({ problem }: { problem: Problem }) {
  const attempt = useAttempt(problem.id);
  return (
    <>
      <FadeIn>
        <Brief problem={problem} />
      </FadeIn>
      {attempt.completedOn ? (
        <FadeIn>
          <Card className="flex items-center gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-success/15 text-success">
              <PartyPopper className="size-6" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[16px] font-semibold">Done for today</span>
              <span className="text-[14px] text-muted-foreground">Tomorrow brings a new problem.</span>
            </div>
            <Button asChild size="sm" variant="tinted">
              <a href="#/library">Work ahead</a>
            </Button>
          </Card>
        </FadeIn>
      ) : null}
      <FadeIn delay={0.05}>
        <Steps problem={problem} />
      </FadeIn>
    </>
  );
}

export function ProblemPage({ id }: { id: string }) {
  const problem = PROBLEM_INDEX.get(id) as Problem | undefined;
  return (
    <Page>
      <TopBar backLabel="Library" backTo="library" large={false} title={problem?.title || "Problem"} />
      {problem ? (
        <>
          <Brief problem={problem} />
          <Steps problem={problem} />
        </>
      ) : (
        <p className="text-muted-foreground">That problem doesn't exist.</p>
      )}
    </Page>
  );
}
