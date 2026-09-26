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
    grounding: demo.defaultGrounding ?? true,
    temperature: demo.defaultHighTemperature ? 1.1 : 0,
    topP: demo.defaultTightTopP ? 0.1 : 1,
    maxTokens: demo.defaultTinyMaxTokens ? 8 : 256,
    injectRateLimit: demo.defaultRateLimit ?? false,
    honorRetryAfter: demo.defaultHonorRetryAfter ?? true,
    vagueGoal: demo.defaultVagueGoal ?? false,
    partialFailure: demo.defaultPartialFailure ?? false,
    overBudget: demo.defaultOverBudget ?? false,
    leakSecret: demo.defaultLeakSecret ?? false,
    routeExplicitly: demo.routeExplicitly ?? false,
    unclearRoute: demo.defaultUnclearRoute ?? false,
    assertGrounding: demo.assertGrounding ?? false,
    dropAssertion: demo.defaultDropAssertion ?? false,
    awaitApproval: demo.awaitApproval ?? false,
    approveWrite: demo.defaultApproveWrite ?? false,
    handoffCheck: demo.handoffCheck ?? false,
    widenHandoff: demo.defaultWidenHandoff ?? false,
    checkTrajectory: demo.checkTrajectory ?? false,
    failEval: demo.defaultFailEval ?? false,
    injectionCheck: demo.injectionCheck ?? false,
    obeyInjection: demo.defaultObeyInjection ?? false,
    crashResume: demo.crashResume ?? false,
    loseCheckpoint: demo.defaultLoseCheckpoint ?? false,
    protocolCheck: demo.protocolCheck ?? false,
    partialCall: demo.defaultPartialCall ?? false,
    conflictCheck: demo.conflictCheck ?? false,
    trustConflict: demo.defaultTrustConflict ?? false,
    judgeCheck: demo.judgeCheck ?? false,
    fluentJudge: demo.defaultFluentJudge ?? false,
    memoryWrite: demo.memoryWrite ?? false,
    storePoison: demo.defaultStorePoison ?? false,
    unsafeTool: demo.unsafeTool ?? false,
    allowDanger: demo.defaultAllowDanger ?? false,
    operateCheck: demo.operateCheck ?? false,
    leakSpan: demo.defaultLeakSpan ?? false,
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
  const [grounding, setGrounding] = useState(demo.defaultGrounding ?? true);
  const [highTemperature, setHighTemperature] = useState(demo.defaultHighTemperature ?? false);
  const [tightTopP, setTightTopP] = useState(demo.defaultTightTopP ?? false);
  const [tinyMaxTokens, setTinyMaxTokens] = useState(demo.defaultTinyMaxTokens ?? false);
  const [injectRateLimit, setInjectRateLimit] = useState(demo.defaultRateLimit ?? false);
  const [honorRetryAfter, setHonorRetryAfter] = useState(demo.defaultHonorRetryAfter ?? true);
  const [vagueGoal, setVagueGoal] = useState(demo.defaultVagueGoal ?? false);
  const [partialFailure, setPartialFailure] = useState(demo.defaultPartialFailure ?? false);
  const [overBudget, setOverBudget] = useState(demo.defaultOverBudget ?? false);
  const [leakSecret, setLeakSecret] = useState(demo.defaultLeakSecret ?? false);
  const [unclearRoute, setUnclearRoute] = useState(demo.defaultUnclearRoute ?? false);
  const [dropAssertion, setDropAssertion] = useState(demo.defaultDropAssertion ?? false);
  const [approveWrite, setApproveWrite] = useState(demo.defaultApproveWrite ?? false);
  const [widenHandoff, setWidenHandoff] = useState(demo.defaultWidenHandoff ?? false);
  const [failEval, setFailEval] = useState(demo.defaultFailEval ?? false);
  const [obeyInjection, setObeyInjection] = useState(demo.defaultObeyInjection ?? false);
  const [loseCheckpoint, setLoseCheckpoint] = useState(demo.defaultLoseCheckpoint ?? false);
  const [partialCall, setPartialCall] = useState(demo.defaultPartialCall ?? false);
  const [trustConflict, setTrustConflict] = useState(demo.defaultTrustConflict ?? false);
  const [fluentJudge, setFluentJudge] = useState(demo.defaultFluentJudge ?? false);
  const [storePoison, setStorePoison] = useState(demo.defaultStorePoison ?? false);
  const [allowDanger, setAllowDanger] = useState(demo.defaultAllowDanger ?? false);
  const [leakSpan, setLeakSpan] = useState(demo.defaultLeakSpan ?? false);
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
      {
        tools,
        memory,
        planning,
        injectFailure,
        grounding,
        temperature: highTemperature ? 1.1 : 0,
        topP: tightTopP ? 0.1 : 1,
        maxTokens: tinyMaxTokens ? 8 : 256,
        injectRateLimit,
        honorRetryAfter,
        vagueGoal,
        partialFailure,
        overBudget,
        leakSecret,
        routeExplicitly: demo.routeExplicitly ?? false,
        unclearRoute,
        assertGrounding: demo.assertGrounding ?? false,
        dropAssertion,
        awaitApproval: demo.awaitApproval ?? false,
        approveWrite,
        handoffCheck: demo.handoffCheck ?? false,
        widenHandoff,
        checkTrajectory: demo.checkTrajectory ?? false,
        failEval,
        injectionCheck: demo.injectionCheck ?? false,
        obeyInjection,
        crashResume: demo.crashResume ?? false,
        loseCheckpoint,
        protocolCheck: demo.protocolCheck ?? false,
        partialCall,
        conflictCheck: demo.conflictCheck ?? false,
        trustConflict,
        judgeCheck: demo.judgeCheck ?? false,
        fluentJudge,
        memoryWrite: demo.memoryWrite ?? false,
        storePoison,
        unsafeTool: demo.unsafeTool ?? false,
        allowDanger,
        operateCheck: demo.operateCheck ?? false,
        leakSpan,
      },
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
      demo.showFailureToggle ||
      demo.showGroundingToggle ||
      demo.showControls ||
      demo.showRateLimitToggle ||
      demo.showClarifyToggle ||
      demo.showPartialToggle ||
      demo.showBudgetToggle ||
      demo.showSecretToggle ||
      demo.showRouterToggle ||
      demo.showAssertionToggle ||
      demo.showApprovalToggle ||
      demo.showHandoffToggle ||
      demo.showEvalToggle ||
      demo.showInjectionToggle ||
      demo.showCrashToggle ||
      demo.showProtocolToggle ||
      demo.showConflictToggle ||
      demo.showJudgeToggle ||
      demo.showPoisonToggle ||
      demo.showUnsafeToggle ||
      demo.showOperateToggle ? (
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

          {demo.showGroundingToggle || demo.showControls || demo.showRateLimitToggle ? (
            <Card>
              <CardHeader>
                <CardTitle>Model call</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {demo.showGroundingToggle ? (
                  <ToggleRow
                    label="Require observations"
                    hint="Off: the model may answer with an empty tool transcript"
                    checked={grounding}
                    onCheckedChange={setGrounding}
                  />
                ) : null}
                {demo.showControls ? (
                  <>
                    <ToggleRow
                      label="High temperature"
                      hint="1.1 — the tail can skip the tool token"
                      checked={highTemperature}
                      onCheckedChange={setHighTemperature}
                    />
                    <ToggleRow
                      label="Tight top-p"
                      hint="0.1 — nucleus collapses back onto the mode"
                      checked={tightTopP}
                      onCheckedChange={setTightTopP}
                    />
                    <ToggleRow
                      label="Tiny max tokens"
                      hint="8 — tool-call JSON is cut off. finish_reason length"
                      checked={tinyMaxTokens}
                      onCheckedChange={setTinyMaxTokens}
                    />
                  </>
                ) : null}
                {demo.showRateLimitToggle ? (
                  <>
                    <ToggleRow
                      label="Inject 429"
                      hint="TPM budget empty. Retry-After: 2"
                      checked={injectRateLimit}
                      onCheckedChange={setInjectRateLimit}
                    />
                    <ToggleRow
                      label="Honor Retry-After"
                      hint="Sleep, then send the same request once"
                      checked={honorRetryAfter}
                      onCheckedChange={setHonorRetryAfter}
                    />
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {demo.showClarifyToggle ||
          demo.showPartialToggle ||
          demo.showBudgetToggle ||
          demo.showSecretToggle ? (
            <Card>
              <CardHeader>
                <CardTitle>Hiring screen</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {demo.showClarifyToggle ? (
                  <ToggleRow
                    label="Goal is underspecified"
                    hint="No time, no headcount, no whiteboard. Ask. Do not invent them."
                    checked={vagueGoal}
                    onCheckedChange={setVagueGoal}
                  />
                ) : null}
                {demo.showPartialToggle ? (
                  <ToggleRow
                    label="Search fails once"
                    hint="Keep the calculator result. Retry only search."
                    checked={partialFailure}
                    onCheckedChange={setPartialFailure}
                  />
                ) : null}
                {demo.showBudgetToggle ? (
                  <ToggleRow
                    label="Answer exceeds the budget"
                    hint="40 tokens left. The answer model wants 800."
                    checked={overBudget}
                    onCheckedChange={setOverBudget}
                  />
                ) : null}
                {demo.showSecretToggle ? (
                  <ToggleRow
                    label="Paste the token into the prompt"
                    hint="This is the wrong design. The run should refuse."
                    checked={leakSecret}
                    onCheckedChange={setLeakSecret}
                  />
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {demo.showRouterToggle ||
          demo.showAssertionToggle ||
          demo.showApprovalToggle ||
          demo.showHandoffToggle ||
          demo.showEvalToggle ||
          demo.showInjectionToggle ||
          demo.showCrashToggle ||
          demo.showProtocolToggle ||
          demo.showConflictToggle ||
          demo.showJudgeToggle ||
          demo.showPoisonToggle ||
          demo.showUnsafeToggle ||
          demo.showOperateToggle ? (
            <Card>
              <CardHeader>
                <CardTitle>Design studio</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {demo.showRouterToggle ? (
                  <ToggleRow
                    label="Goal is unclear"
                    hint="The router should stop. It should not pick a desk."
                    checked={unclearRoute}
                    onCheckedChange={setUnclearRoute}
                  />
                ) : null}
                {demo.showAssertionToggle ? (
                  <ToggleRow
                    label="Drop the grounding assertion"
                    hint="The harness may answer with no tool message."
                    checked={dropAssertion}
                    onCheckedChange={setDropAssertion}
                  />
                ) : null}
                {demo.showApprovalToggle ? (
                  <ToggleRow
                    label="Approve the reserve"
                    hint="Off: reject, ledger stays empty. On: write once."
                    checked={approveWrite}
                    onCheckedChange={setApproveWrite}
                  />
                ) : null}
                {demo.showHandoffToggle ? (
                  <ToggleRow
                    label="Add rooms to the weather ticket"
                    hint="The allow-list should reject the extra tool."
                    checked={widenHandoff}
                    onCheckedChange={setWidenHandoff}
                  />
                ) : null}
                {demo.showEvalToggle ? (
                  <ToggleRow
                    label="Answer with no weather call"
                    hint="The sentence sounds right. The eval should fail."
                    checked={failEval}
                    onCheckedChange={setFailEval}
                  />
                ) : null}
                {demo.showInjectionToggle ? (
                  <ToggleRow
                    label="Obey the tool text"
                    hint="Off: East stays unreserved. On: that is the bug."
                    checked={obeyInjection}
                    onCheckedChange={setObeyInjection}
                  />
                ) : null}
                {demo.showCrashToggle ? (
                  <ToggleRow
                    label="Resume without the ledger"
                    hint="On: a new key charges again. Off: the same receipt, provider skipped."
                    checked={loseCheckpoint}
                    onCheckedChange={setLoseCheckpoint}
                  />
                ) : null}
                {demo.showProtocolToggle ? (
                  <ToggleRow
                    label="Execute a partial tool call"
                    hint="On: sliced JSON runs. Off: refuse it and repair the schema."
                    checked={partialCall}
                    onCheckedChange={setPartialCall}
                  />
                ) : null}
                {demo.showConflictToggle ? (
                  <ToggleRow
                    label="Pick one side of the conflict"
                    hint="On: cite search for 70%. Off: the observations disagree."
                    checked={trustConflict}
                    onCheckedChange={setTrustConflict}
                  />
                ) : null}
                {demo.showJudgeToggle ? (
                  <ToggleRow
                    label="Grade the sentence"
                    hint="On: fluency passes a guess. Off: the tool message has to contain 70%."
                    checked={fluentJudge}
                    onCheckedChange={setFluentJudge}
                  />
                ) : null}
                {demo.showPoisonToggle ? (
                  <ToggleRow
                    label="Store the summary"
                    hint="On: an invented East preference becomes evidence. Off: only fields you chose."
                    checked={storePoison}
                    onCheckedChange={setStorePoison}
                  />
                ) : null}
                {demo.showUnsafeToggle ? (
                  <ToggleRow
                    label="Allow the metadata URL"
                    hint="On: the allow-list is not an argument check. Off: deny it before the call."
                    checked={allowDanger}
                    onCheckedChange={setAllowDanger}
                  />
                ) : null}
                {demo.showOperateToggle ? (
                  <ToggleRow
                    label="Leave the secret in the span"
                    hint="On: sk-live stays in the trace. Off: redact, price the spans, roll back."
                    checked={leakSpan}
                    onCheckedChange={setLeakSpan}
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
          showGroundingToggle: true,
          showControls: true,
          showRateLimitToggle: true,
          showClarifyToggle: missionId === "book-room",
          showPartialToggle: missionId === "dinner-tip",
          showBudgetToggle: true,
          showSecretToggle: missionId === "book-room",
          dualRun: true,
          defaultMemory: true,
          defaultPlanning: true,
          defaultFailure: missionId === "book-room",
        }}
      />
    </div>
  );
}
