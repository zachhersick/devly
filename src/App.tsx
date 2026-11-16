// App shell: routes with page transitions and the floating tab bar, which
// hides during practice steps so the action buttons own the bottom edge.
import { BookOpen, CalendarCheck, TrendingUp } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { softSpring, spring } from "@/components/kit";
import { PROBLEM_INDEX } from "@/content/index.js";
import { route } from "@/lib/router.js";
import { loaded } from "@/lib/store.js";
import { useValue } from "@/lib/use-signal";
import { cn } from "@/lib/utils";
import { CardsPage } from "@/pages/cards";
import { DesignPage } from "@/pages/design";
import { DiagramPage } from "@/pages/diagram";
import { Deck, Library } from "@/pages/library";
import { ProgressPage } from "@/pages/progress";
import { QuizPage } from "@/pages/quiz";
import { ProblemPage, Today } from "@/pages/today";

const TABS = [
  { page: "today", label: "Today", icon: CalendarCheck, match: ["today"] },
  { page: "library", label: "Library", icon: BookOpen, match: ["library", "deck", "problem"] },
  { page: "progress", label: "Progress", icon: TrendingUp, match: ["progress"] }
];

const PRACTICE = ["quiz", "diagram", "design", "cards"];

function pageFor(page: string, id: string | null): ReactNode {
  const known = id && PROBLEM_INDEX.has(id);
  if (page === "problem" && id) return <ProblemPage id={id} />;
  if (page === "quiz" && known) return <QuizPage id={id} />;
  if (page === "diagram" && known) return <DiagramPage id={id} />;
  if (page === "design" && known) return <DesignPage id={id} />;
  if (page === "cards" && known) return <CardsPage id={id} />;
  if (page === "library") return <Library />;
  if (page === "deck") return <Deck />;
  if (page === "progress") return <ProgressPage />;
  return <Today />;
}

function TabBar() {
  const { page } = useValue(route) as { page: string };
  return (
    <nav aria-label="Main" className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4">
      <div className="glass pointer-events-auto mb-3 flex w-full max-w-sm items-center justify-between rounded-full p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        {TABS.map((tab) => {
          const on = tab.match.includes(page);
          const Icon = tab.icon;
          return (
            <a aria-current={on ? "page" : undefined} className={cn("relative flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium", on ? "text-primary" : "text-muted-foreground")} href={`#/${tab.page}`} key={tab.page}>
              {on ? <motion.span className="absolute inset-0 rounded-full bg-primary/14" layoutId="tab-pill" transition={spring} /> : null}
              <Icon className="relative size-5" strokeWidth={on ? 2 : 1.75} />
              <span className="relative">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  const ready = useValue(loaded);
  const r = useValue(route) as { page: string; id: string | null };
  const practicing = PRACTICE.includes(r.page);
  const depth = practicing ? 2 : r.id ? 1 : 0;
  const lastDepth = useRef(depth);
  const direction = depth >= lastDepth.current ? 1 : -1;
  useEffect(() => {
    lastDepth.current = depth;
    window.scrollTo(0, 0);
  }, [r.page, r.id, depth]);

  if (!ready) return null;
  const key = `${r.page}/${r.id || ""}`;
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.main
          animate={{ opacity: 1, x: 0, scale: 1 }}
          className="relative min-h-dvh"
          exit={{ opacity: 0, x: depth ? -24 * direction : 0, scale: depth ? 1 : 0.985 }}
          initial={{ opacity: 0, x: depth ? 40 * direction : 0, scale: depth ? 1 : 0.985 }}
          key={key}
          transition={softSpring}
        >
          {pageFor(r.page, r.id)}
        </motion.main>
      </AnimatePresence>
      {practicing ? null : <TabBar />}
    </MotionConfig>
  );
}
