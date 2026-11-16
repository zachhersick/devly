// Flashcards for the problem's concepts plus a few older cards due for review.
// Tap to flip, then rate; ratings schedule the next review (Leitner boxes).
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Card, FadeIn, motion, softSpring } from "@/components/kit";
import { PracticeFrame, Progress, tagLabel, useAttempt, type Problem } from "@/components/problem";
import { Button } from "@/components/ui/button";
import { CARD_INDEX, CARDS, PROBLEM_INDEX } from "@/content/index.js";
import { haptic } from "@/lib/haptics.js";
import { cardDeck } from "@/lib/model.js";
import { back } from "@/lib/router.js";
import { cardStates, finish, rate, today, updateAttempt } from "@/lib/store.js";
import { useWakeLock } from "@/lib/wake";

type Concept = { id: string; front: string; back: string; tags: string[] };

export function CardsPage({ id }: { id: string }) {
  const problem = PROBLEM_INDEX.get(id) as Problem;
  const attempt = useAttempt(id);
  useWakeLock();
  // The deck is fixed when the page opens, so rating a review card doesn't reshuffle it.
  const [deck] = useState<Concept[]>(() => {
    const ids = new Set<string>(attempt.cards.rated);
    const fresh = cardDeck(problem, CARDS, cardStates.value, today.value) as Concept[];
    return [...attempt.cards.rated.map((cardId) => CARD_INDEX.get(cardId)).filter(Boolean), ...fresh.filter((card) => !ids.has(card.id))] as Concept[];
  });
  const [flipped, setFlipped] = useState(false);
  const rated = new Set(attempt.cards.rated);
  const current = deck.find((card) => !rated.has(card.id));
  const position = deck.filter((card) => rated.has(card.id)).length;

  const answer = async (rating: "good" | "again") => {
    if (!current) return;
    haptic(rating === "good" ? 8 : [12, 40, 12]);
    setFlipped(false);
    await rate(current.id, rating);
    await updateAttempt(id, (d) => (d.cards.rated = [...d.cards.rated, current.id]));
    if (position + 1 >= deck.length) finish(id, "cards");
  };

  if (!current) {
    return (
      <PracticeFrame
        actions={
          <>
            <Button className="flex-1" onClick={() => updateAttempt(id, (d) => (d.cards.rated = []))} size="lg" variant="secondary">
              <RotateCcw /> Again
            </Button>
            <Button className="flex-1" onClick={() => back(`problem/${id}`)} size="lg">
              Continue
            </Button>
          </>
        }
        problemId={id}
        title="Cards"
      >
        <Progress current={deck.length} total={Math.max(deck.length, 1)} />
        <FadeIn className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="text-[40px] font-medium tabular">{deck.length}</span>
          <span className="text-[15px] text-muted-foreground">cards reviewed. They'll come back when they're due.</span>
        </FadeIn>
      </PracticeFrame>
    );
  }

  const own = problem.cardIds.includes(current.id);
  return (
    <PracticeFrame
      actions={
        flipped ? (
          <>
            <Button className="flex-1" onClick={() => answer("again")} size="lg" variant="destructive">
              Again
            </Button>
            <Button className="flex-1" onClick={() => answer("good")} size="lg">
              Got it
            </Button>
          </>
        ) : (
          <Button className="flex-1" onClick={() => setFlipped(true)} size="lg" variant="secondary">
            Show answer
          </Button>
        )
      }
      problemId={id}
      title="Cards"
    >
      <Progress current={position} total={deck.length} />
      <span className="px-1 text-[13px] font-medium text-muted-foreground">
        {position + 1} of {deck.length} · {own ? "today's concept" : "review"}
      </span>
      <button aria-label={flipped ? "Card answer" : "Flip card"} className="block w-full [perspective:1200px]" onClick={() => setFlipped(!flipped)} type="button">
        <motion.div animate={{ rotateY: flipped ? 180 : 0 }} className="relative min-h-72 [transform-style:preserve-3d]" key={current.id} transition={softSpring}>
          <Card className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center [backface-visibility:hidden]">
            <span className="text-[24px] leading-tight font-medium">{current.front}</span>
            <span className="text-[13px] text-muted-foreground">{current.tags.map(tagLabel).join(" · ")}</span>
          </Card>
          <Card className="absolute inset-0 flex items-center p-6 text-left [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-[16px] leading-relaxed">{current.back}</p>
          </Card>
        </motion.div>
      </button>
    </PracticeFrame>
  );
}
