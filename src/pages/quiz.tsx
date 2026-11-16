// Multiple-choice steps through the interview flow. Every answer is saved as
// soon as it's tapped, so the quiz picks up where you left off.
import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { Card, FadeIn, motion } from "@/components/kit";
import { PracticeFrame, Progress, tagLabel, useAttempt, type Problem } from "@/components/problem";
import { Button } from "@/components/ui/button";
import { PROBLEM_INDEX } from "@/content/index.js";
import { haptic } from "@/lib/haptics.js";
import { quizPosition, quizScore } from "@/lib/model.js";
import { back } from "@/lib/router.js";
import { finish, updateAttempt } from "@/lib/store.js";
import { cn } from "@/lib/utils";
import { useWakeLock } from "@/lib/wake";

export function QuizPage({ id }: { id: string }) {
  const problem = PROBLEM_INDEX.get(id) as Problem;
  const attempt = useAttempt(id);
  const [index, setIndex] = useState(() => quizPosition(attempt, problem));
  useWakeLock();
  const answers = attempt.quiz.answers;
  const marks = problem.quiz.map((item, i) => (answers[i] === undefined || answers[i] === null ? null : answers[i] === item.answer ? "right" : "wrong"));

  if (index >= problem.quiz.length) {
    const score = quizScore(attempt, problem);
    return (
      <PracticeFrame
        actions={
          <>
            <Button
              className="flex-1"
              onClick={() => {
                updateAttempt(id, (draft) => (draft.quiz.answers = []));
                setIndex(0);
              }}
              size="lg"
              variant="secondary"
            >
              <RotateCcw /> Retake
            </Button>
            <Button className="flex-1" onClick={() => back(`problem/${id}`)} size="lg">
              Continue
            </Button>
          </>
        }
        problemId={id}
        title="Quiz"
      >
        <Progress current={problem.quiz.length} marks={marks} total={problem.quiz.length} />
        <FadeIn className="flex flex-col items-center gap-1 py-6 text-center">
          <span className="text-[56px] leading-none font-medium tabular">
            {score.right}
            <span className="text-[28px] text-muted-foreground">/{score.total}</span>
          </span>
          <span className="text-[15px] text-muted-foreground">{score.right === score.total ? "Perfect run." : score.right >= score.total * 0.7 ? "Solid. Review the misses below." : "Worth another pass later."}</span>
        </FadeIn>
        <div className="flex flex-col gap-2">
          {problem.quiz.map((item, i) => (
            <Card className="flex gap-3 p-4" key={item.q}>
              <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", marks[i] === "right" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                {marks[i] === "right" ? <Check className="size-3.5" strokeWidth={2.5} /> : <X className="size-3.5" strokeWidth={2.5} />}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[14px] font-medium">{item.q}</span>
                <span className="text-[13px] text-muted-foreground">{item.choices[item.answer]}</span>
              </div>
            </Card>
          ))}
        </div>
      </PracticeFrame>
    );
  }

  const item = problem.quiz[index];
  const picked = answers[index];
  const answered = picked !== undefined && picked !== null;
  const next = () => {
    if (index + 1 >= problem.quiz.length) finish(id, "quiz");
    setIndex(index + 1);
  };

  return (
    <PracticeFrame
      actions={
        answered ? (
          <Button className="flex-1" onClick={next} size="lg">
            {index + 1 >= problem.quiz.length ? "See results" : "Next"}
          </Button>
        ) : null
      }
      problemId={id}
      title="Quiz"
    >
      <Progress current={index} marks={marks} total={problem.quiz.length} />
      <motion.div animate={{ opacity: 1, x: 0 }} className="flex flex-1 flex-col gap-5" initial={{ opacity: 0, x: 24 }} key={index}>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted-foreground">
            <span className="font-mono text-[12px] tabular">
              {index + 1}/{problem.quiz.length}
            </span>{" "}
            · {tagLabel(item.tag)}
          </span>
          <h1 className="text-[20px] leading-snug font-medium">{item.q}</h1>
        </div>
        <div className="mt-auto flex flex-col gap-3">
          {item.choices.map((choice, i) => {
            const right = answered && i === item.answer;
            const wrong = answered && i === picked && i !== item.answer;
            return (
              <button
                className={cn(
                  "surface flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] leading-snug font-medium transition-colors active:scale-[0.99]",
                  right && "border-success bg-success/12",
                  wrong && "border-destructive bg-destructive/12",
                  answered && !right && !wrong && "opacity-55"
                )}
                disabled={answered}
                key={choice}
                onClick={() => {
                  haptic(i === item.answer ? 8 : [12, 40, 12]);
                  updateAttempt(id, (draft) => (draft.quiz.answers[index] = i));
                }}
                type="button"
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[13px] font-medium", right && "bg-success text-white", wrong && "bg-destructive text-white")}>
                  {right ? <Check className="size-4" strokeWidth={2.5} /> : wrong ? <X className="size-4" strokeWidth={2.5} /> : String.fromCharCode(65 + i)}
                </span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>
        {answered ? (
          <FadeIn>
            <Card className={cn("p-4 text-[14px] leading-relaxed", picked === item.answer ? "bg-success/8" : "bg-destructive/8")}>
              <span className="font-medium">{picked === item.answer ? "Right. " : "Not quite. "}</span>
              {item.why}
            </Card>
          </FadeIn>
        ) : null}
      </motion.div>
    </PracticeFrame>
  );
}
