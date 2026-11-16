// Streaks, accuracy by topic, appearance and backups.
import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Card, List, Page, Row, Section, Segmented, StatTiles, Toggle, TopBar } from "@/components/kit";
import { tagLabel } from "@/components/problem";
import { PROBLEM_INDEX, PROBLEMS } from "@/content/index.js";
import { accuracyByTag, longestStreak, streak } from "@/lib/model.js";
import { attempts, cardStates, days, exportData, importRecords, resetProgress, saveSettings, settings, today } from "@/lib/store.js";
import { TINTS } from "@/lib/theme.js";
import { useValue } from "@/lib/use-signal";
import { cn } from "@/lib/utils";

export function ProgressPage() {
  const dayList = useValue(days);
  const day = useValue(today);
  const tries = useValue(attempts);
  const states = useValue(cardStates);
  const prefs = useValue(settings);
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const accuracy = accuracyByTag(tries, PROBLEM_INDEX);
  // The topic to work on: lowest accuracy among those with a few answers, if it's below 70%.
  const weakTag = accuracy.filter((row) => row.total >= 3 && row.pct < 70).sort((a, b) => a.pct - b.pct)[0]?.tag;
  const finished = tries.filter((a: any) => a.completedOn).length;

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `devly-backup-${day}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const restore = async (picked?: File) => {
    if (!picked) return;
    try {
      const data = JSON.parse(await picked.text());
      if (data?.app !== "devly" || !Array.isArray(data.records)) throw new Error("not a Devly backup");
      const count = await importRecords(data.records);
      setMessage(count ? `Restored ${count} records.` : "Nothing newer in that backup.");
    } catch {
      setMessage("That file isn't a Devly backup.");
    }
    if (file.current) file.current.value = "";
  };

  return (
    <Page>
      <TopBar title="Progress" />
      <StatTiles
        items={[
          { label: "Streak", value: streak(dayList, day), unit: "days" },
          { label: "Best streak", value: longestStreak(dayList), unit: "days" },
          { label: "Problems", value: finished, sub: `of ${PROBLEMS.length}` },
          { label: "Cards reviewed", value: states.size }
        ]}
      />

      <Section footer="First answers only, from every quiz you've taken." title="Accuracy by topic">
        {accuracy.length ? (
          <Card className="flex flex-col gap-4 p-4">
            {accuracy.map((row) => {
              const weakest = row.tag === weakTag;
              return (
                <div className="flex flex-col gap-2" key={row.tag}>
                  <div className="flex items-baseline justify-between text-[14px]">
                    <span className="font-medium">
                      {tagLabel(row.tag)}
                      {weakest ? <span className="ml-2 text-[12px] font-normal text-primary">weakest</span> : null}
                    </span>
                    <span className="font-mono text-[12px] text-muted-foreground tabular">
                      {row.pct}% · {row.right}/{row.total}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", weakest ? "bg-primary" : "bg-foreground/35")} style={{ width: `${Math.max(row.pct, 3)}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>
        ) : (
          <Card className="p-4 text-[14px] text-muted-foreground">Take a quiz to see how you do by topic.</Card>
        )}
      </Section>

      <Section title="Appearance">
        <Card className="flex flex-col gap-4 p-4">
          <Segmented
            label="Theme"
            onChange={(theme) => saveSettings({ theme })}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" }
            ]}
            value={prefs.theme}
          />
          <div aria-label="Accent color" className="flex justify-between" role="radiogroup">
            {TINTS.map((tint) => (
              <button
                aria-checked={prefs.tint === tint.id}
                aria-label={tint.label}
                className={cn("size-10 rounded-full ring-offset-2 ring-offset-card transition-shadow duration-150", prefs.tint === tint.id && "ring-2 ring-foreground")}
                key={tint.id}
                onClick={() => saveSettings({ tint: tint.id })}
                role="radio"
                style={{ background: tint.color }}
                type="button"
              />
            ))}
          </div>
        </Card>
      </Section>

      <Section footer="Stops your phone locking while you're on a quiz, diagram or card." title="At the gym">
        <List>
          <Row title="Keep screen awake">
            <Toggle checked={prefs.keepAwake} label="Keep screen awake" onChange={(keepAwake) => saveSettings({ keepAwake })} />
          </Row>
        </List>
      </Section>

      <Section footer={message || "Progress is stored only on this device. Export a backup now and then."} title="Backup">
        <List>
          <Row icon={Download} onClick={download} title="Export backup" tone="action" />
          <Row icon={Upload} onClick={() => file.current?.click()} title="Import backup" tone="action" />
          <Row
            icon={RotateCcw}
            iconClass="bg-destructive/15 text-destructive"
            onClick={() => {
              if (confirm("Reset all progress? Streaks, answers, drafts and card reviews will be cleared.")) resetProgress().then(() => setMessage("Progress reset."));
            }}
            title="Reset progress"
            tone="danger"
          />
        </List>
        <input accept="application/json,.json" className="hidden" onChange={(event) => restore(event.target.files?.[0])} ref={file} type="file" />
      </Section>
    </Page>
  );
}
