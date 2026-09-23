"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { AgentTrace } from "@/components/agent-trace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { chatbotReply, getMission } from "@/lib/agent/missions";
import { defaultConfig, runAgent } from "@/lib/agent/runtime";
import type { AgentRun, MissionId, RunConfig, ToolFlags, ToolName } from "@/lib/agent/types";
import type { LessonDemo } from "@/lib/lessons";
import { TOOL_META } from "@/lib/tools-meta";
import { cn } from "@/lib/utils";

const ALL_TOOLS: ToolName[] = [
  "weather",
  "calculator",
  "search",
  "calendar",
  "rooms",
  "notes",
];

function configFromDemo(demo: LessonDemo): RunConfig {
  return defaultConfig({
    memory: demo.defaultMemory ?? false,
    planning: demo.defaultPlanning ?? false,
    injectFailure: demo.defaultFailure ?? false,
    tools: demo.defaultTools,
  });
}

export function Studio({
  demo,
  hint,
  onFirstAnswer,
}: {
  demo: LessonDemo;
  hint: string;
  onFirstAnswer?: () => void;
}) {
  const [tools, setTools] = useState<ToolFlags>(() => configFromDemo(demo).tools);
  const [memory, setMemory] = useState(demo.defaultMemory ?? false);
  const [planning, setPlanning] = useState(demo.defaultPlanning ?? false);
  const [injectFailure, setInjectFailure] = useState(demo.defaultFailure ?? false);
  const [notes, setNotes] = useState<string[]>([]);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [visible, setVisible] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [chatbot, setChatbot] = useState<string | null>(null);
  const [pass, setPass] = useState(0);

  const mission = useMemo(() => getMission(demo.missionId), [demo.missionId]);

  useEffect(() => {
    if (!playing || !run || visible >= run.steps.length) return;
    const timer = window.setTimeout(() => {
      setVisible((count) => count + 1);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [playing, run, visible]);

  useEffect(() => {
    if (!run || visible < run.steps.length) return;
    if (run.status === "answered") onFirstAnswer?.();
  }, [onFirstAnswer, run, visible]);

  function startRun() {
    const next = runAgent(
      demo.missionId,
      { tools, memory, planning, injectFailure },
      notes,
    );
    setRun(next);
    setVisible(0);
    setPlaying(true);
    setPass((value) => value + 1);
    if (memory) {
      setNotes((current) => {
        const merged = [...current];
        for (const note of next.notes) {
          if (!merged.includes(note)) merged.push(note);
        }
        return merged;
      });
    }
    if (demo.compareChatbot) {
      setChatbot(chatbotReply(demo.missionId));
    }
  }

  function resetStudio() {
    setRun(null);
    setVisible(0);
    setPlaying(false);
    setChatbot(null);
    setNotes([]);
    setPass(0);
  }

  const revealed = run ? Math.min(visible, run.steps.length) : 0;
  const finished = Boolean(run && revealed === run.steps.length);
  const isPlaying = playing && Boolean(run) && !finished;
  const currentAnswer =
    finished && run?.status === "answered" ? run.answer : null;
  const currentBlock =
    finished && run?.status === "blocked"
      ? run.steps.find((step) => step.kind === "error")?.body
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
            Live studio
          </p>
          <h3 className="font-heading mt-1 text-2xl leading-tight">{mission.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
          <p className="mt-3 rounded-lg bg-background/70 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Goal · </span>
            {mission.goal}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={startRun} size="lg">
            <Play data-icon="inline-start" />
            {run ? "Run again" : "Run the agent"}
          </Button>
          {run ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPlaying((value) => !value)}
                disabled={finished}
              >
                {isPlaying ? (
                  <Pause data-icon="inline-start" />
                ) : (
                  <SkipForward data-icon="inline-start" />
                )}
                {isPlaying ? "Pause" : "Step / play"}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  if (!run) return;
                  if (revealed < run.steps.length) {
                    setVisible((count) => count + 1);
                    setPlaying(false);
                  }
                }}
                disabled={finished}
              >
                Next step
              </Button>
            </>
          ) : null}
          <Button variant="ghost" size="lg" onClick={resetStudio}>
            <RotateCcw data-icon="inline-start" />
            Reset
          </Button>
        </div>
      </div>

      {demo.allowToolToggle ||
      demo.showMemoryToggle ||
      demo.showPlanningToggle ||
      demo.showFailureToggle ? (
        <div className="grid gap-3 md:grid-cols-2">
          {demo.allowToolToggle ? (
            <Card>
              <CardHeader>
                <CardTitle>Attached tools</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {ALL_TOOLS.filter((name) =>
                  demo.defaultTools ? name in (demo.defaultTools ?? {}) : true,
                ).map((name) => (
                  <label
                    key={name}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span>
                      <span className="block font-mono text-sm">{TOOL_META[name].label}</span>
                      <span className="text-xs text-muted-foreground">
                        {TOOL_META[name].hint}
                      </span>
                    </span>
                    <Switch
                      checked={tools[name]}
                      onCheckedChange={(checked) =>
                        setTools((current) => ({ ...current, [name]: checked }))
                      }
                    />
                  </label>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {demo.showMemoryToggle ||
          demo.showPlanningToggle ||
          demo.showFailureToggle ? (
            <Card>
              <CardHeader>
                <CardTitle>Loop options</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {demo.showMemoryToggle ? (
                  <ToggleRow
                    label="Long-term notes"
                    hint={
                      notes.length
                        ? `${notes.length} note${notes.length > 1 ? "s" : ""} stored`
                        : "Write facts the next run can recall"
                    }
                    checked={memory}
                    onCheckedChange={setMemory}
                  />
                ) : null}
                {demo.showPlanningToggle ? (
                  <ToggleRow
                    label="Write a plan first"
                    hint="A cheap hypothesis before any tool call"
                    checked={planning}
                    onCheckedChange={setPlanning}
                  />
                ) : null}
                {demo.showFailureToggle ? (
                  <ToggleRow
                    label="Inject a booking conflict"
                    hint="East room is already held at 2pm"
                    checked={injectFailure}
                    onCheckedChange={setInjectFailure}
                  />
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {demo.compareChatbot ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-2">
                Chatbot
                <Badge variant="secondary">one completion</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm leading-6 text-muted-foreground">
              {chatbot ??
                "Press run. This side is one completion: no edge can reject the text."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-2">
                Agent
                <Badge>evidence gate</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <AgentTrace
                steps={run?.steps ?? []}
                visibleCount={revealed}
                emptyLabel="The agent is waiting. Run it to see weather, then a decision."
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <AgentTrace
          steps={run?.steps ?? []}
          visibleCount={revealed}
          emptyLabel="Nothing has run yet. Start the agent and step through the trace."
        />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard
          label="Status"
          value={
            !run
              ? "idle"
              : !finished
                ? "running"
                : run.status
          }
          tone={!run ? "muted" : !finished ? "live" : run.status}
        />
        <StatusCard
          label="Steps revealed"
          value={run ? `${revealed}/${run.steps.length}` : "0"}
          tone="muted"
        />
        <StatusCard
          label={demo.dualRun ? "Pass" : "Tools used"}
          value={
            demo.dualRun
              ? pass === 0
                ? "not started"
                : `run ${pass}`
              : run?.toolsUsed.length
                ? run.toolsUsed.join(", ")
                : "—"
          }
          tone="muted"
        />
      </div>

      {currentAnswer ? (
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm leading-6 text-lime-50">
          <p className="font-mono text-[11px] tracking-wider uppercase opacity-80">
            Final answer
          </p>
          <p className="mt-1">{currentAnswer}</p>
        </div>
      ) : null}

      {currentBlock ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-6">
          <p className="font-mono text-[11px] tracking-wider text-destructive uppercase">
            The agent stopped on purpose
          </p>
          <p className="mt-1">{currentBlock}</p>
        </div>
      ) : null}

      {demo.dualRun && notes.length > 0 ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-sm">
          <p className="font-mono text-[11px] tracking-wider text-emerald-200 uppercase">
            Notes the next run can use
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-emerald-50/90">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/70 px-4 py-3">
      <p className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-sm",
          tone === "answered" && "text-lime-300",
          tone === "blocked" && "text-red-300",
          tone === "live" && "text-amber-200",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function PlaygroundStudio() {
  const [missionId, setMissionId] = useState<MissionId>("tokyo-weekend");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["tokyo-weekend", "Tokyo weekend"],
            ["dinner-tip", "Dinner check"],
            ["book-room", "Room booking"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={missionId === id ? "default" : "outline"}
            onClick={() => setMissionId(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      <Studio
        key={missionId}
        hint="Flip tools, memory, planning, and a conflict. The simulated agent is deterministic so you can study the trace."
        demo={{
          missionId,
          compareChatbot: false,
          allowToolToggle: true,
          showMemoryToggle: true,
          showPlanningToggle: true,
          showFailureToggle: missionId === "book-room",
          dualRun: true,
          defaultMemory: true,
          defaultPlanning: true,
          defaultFailure: missionId === "book-room",
        }}
      />
    </div>
  );
}
