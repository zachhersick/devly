// The reference architecture, built up one component per tap.
import { ChevronLeft } from "lucide-react";
import { Card, motion } from "@/components/kit";
import { DiagramView } from "@/components/diagram-view";
import { PracticeFrame, Progress, useAttempt, type Problem } from "@/components/problem";
import { Button } from "@/components/ui/button";
import { PROBLEM_INDEX } from "@/content/index.js";
import { haptic } from "@/lib/haptics.js";
import { back } from "@/lib/router.js";
import { finish, updateAttempt } from "@/lib/store.js";
import { useWakeLock } from "@/lib/wake";

export function DiagramPage({ id }: { id: string }) {
  const problem = PROBLEM_INDEX.get(id) as Problem;
  const attempt = useAttempt(id);
  useWakeLock();
  const steps = problem.diagram.steps;
  const step = Math.min(attempt.diagram.step || 0, steps.length - 1);
  const last = step === steps.length - 1;
  const move = (to: number) => {
    haptic(4);
    updateAttempt(id, (draft) => (draft.diagram.step = to));
  };
  const forward = () => {
    if (!last) return move(step + 1);
    finish(id, "diagram");
    back(`problem/${id}`);
  };

  return (
    <PracticeFrame
      actions={
        <>
          <Button aria-label="Previous step" disabled={step === 0} onClick={() => move(step - 1)} size="lg" variant="secondary">
            <ChevronLeft className="size-5" />
          </Button>
          <Button className="flex-1" onClick={forward} size="lg">
            {last ? "Finish" : "Next"}
          </Button>
        </>
      }
      problemId={id}
      title="Diagram"
    >
      <Progress current={step} total={steps.length} />
      <Card className="p-2">
        <button aria-label={last ? "Diagram complete" : "Show next step"} className="whiteboard block w-full rounded-[10px]" onClick={() => !last && move(step + 1)} type="button">
          <DiagramView diagram={problem.diagram} step={step} />
        </button>
      </Card>
      <motion.p animate={{ opacity: 1, y: 0 }} className="px-1 text-[16px] leading-relaxed" initial={{ opacity: 0, y: 6 }} key={step}>
        <span className="mr-2 font-mono text-[13px] text-primary tabular">
          {step + 1}/{steps.length}
        </span>
        {steps[step].caption}
      </motion.p>
    </PracticeFrame>
  );
}
