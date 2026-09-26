import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConfig, runAgent } from "./runtime";

test("tokyo-weekend answers when weather is attached", () => {
  const run = runAgent("tokyo-weekend", defaultConfig());
  assert.equal(run.status, "answered");
  assert.match(run.answer ?? "", /umbrella/i);
  assert.deepEqual(run.toolsUsed, ["weather"]);
});

test("tokyo-weekend blocks without weather", () => {
  const run = runAgent(
    "tokyo-weekend",
    defaultConfig({ tools: { weather: false } }),
  );
  assert.equal(run.status, "blocked");
  assert.equal(run.answer, null);
  assert.ok(run.steps.some((step) => step.kind === "error"));
});

test("dinner-tip needs both calculator and search", () => {
  const both = runAgent("dinner-tip", defaultConfig());
  assert.equal(both.status, "answered");
  assert.match(both.answer ?? "", /14\.62/);

  const noCalc = runAgent(
    "dinner-tip",
    defaultConfig({ tools: { calculator: false } }),
  );
  assert.equal(noCalc.status, "blocked");

  const noSearch = runAgent(
    "dinner-tip",
    defaultConfig({ tools: { search: false } }),
  );
  assert.equal(noSearch.status, "blocked");
});

test("planning prepends a plan step", () => {
  const run = runAgent("book-room", defaultConfig({ planning: true }));
  assert.equal(run.steps[0]?.kind, "plan");
});

test("booking conflict replans to the west room", () => {
  const run = runAgent("book-room", defaultConfig({ injectFailure: true }));
  assert.equal(run.status, "answered");
  assert.ok(run.steps.some((step) => step.kind === "replan"));
  assert.match(run.answer ?? "", /West/);
});

test("ungrounded dinner answer skips tools", () => {
  const run = runAgent("dinner-tip", defaultConfig({ grounding: false }));
  assert.equal(run.status, "answered");
  assert.deepEqual(run.toolsUsed, []);
  assert.match(run.answer ?? "", /roughly \$15/);
});

test("high temperature skips the tool unless top-p is tight", () => {
  const hot = runAgent(
    "tokyo-weekend",
    defaultConfig({ temperature: 1.1, topP: 1 }),
  );
  assert.deepEqual(hot.toolsUsed, []);
  assert.match(hot.answer ?? "", /climate prior/);

  const tight = runAgent(
    "tokyo-weekend",
    defaultConfig({ temperature: 1.1, topP: 0.1 }),
  );
  assert.deepEqual(tight.toolsUsed, ["weather"]);
  assert.match(tight.answer ?? "", /umbrella/i);
});

test("tiny max tokens stops before a tool runs", () => {
  const run = runAgent("tokyo-weekend", defaultConfig({ maxTokens: 8 }));
  assert.equal(run.status, "blocked");
  assert.equal(run.answer, null);
  assert.match(run.steps.at(-1)?.body ?? "", /max_tokens/);
});

test("honored retry-after still answers, ignored retry exhausts", () => {
  const honored = runAgent(
    "tokyo-weekend",
    defaultConfig({ injectRateLimit: true, honorRetryAfter: true }),
  );
  assert.equal(honored.status, "answered");
  assert.match(honored.answer ?? "", /umbrella/i);
  assert.ok(honored.steps.some((step) => step.title.includes("429")));

  const hammered = runAgent(
    "tokyo-weekend",
    defaultConfig({ injectRateLimit: true, honorRetryAfter: false }),
  );
  assert.equal(hammered.status, "blocked");
  assert.equal(hammered.answer, null);
  assert.match(hammered.steps.at(-1)?.body ?? "", /Second 429/);
});

test("a vague booking asks and does not reserve", () => {
  const vague = runAgent("book-room", defaultConfig({ vagueGoal: true }));
  assert.equal(vague.status, "answered");
  assert.deepEqual(vague.toolsUsed, []);
  assert.match(vague.answer ?? "", /whiteboard/i);
  assert.doesNotMatch(vague.answer ?? "", /East/);

  const specified = runAgent("book-room", defaultConfig({ vagueGoal: false }));
  assert.ok(specified.toolsUsed.includes("rooms"));
});

test("a failed search does not recompute the tip", () => {
  const run = runAgent("dinner-tip", defaultConfig({ partialFailure: true }));
  const calculatorCalls = run.steps.filter((step) => step.title.includes("calculator"));
  assert.equal(calculatorCalls.length, 1);
  assert.ok(run.steps.some((step) => step.body.includes("Do not recompute")));
  assert.match(run.answer ?? "", /14\.62/);
});

test("an over-budget answer is not sent", () => {
  const run = runAgent("tokyo-weekend", defaultConfig({ overBudget: true }));
  assert.equal(run.status, "blocked");
  assert.match(run.steps.at(-1)?.body ?? "", /40 tokens/);
  assert.deepEqual(run.toolsUsed, []);
});

test("an unclear goal does not pick a desk", () => {
  const unclear = runAgent(
    "tokyo-weekend",
    defaultConfig({ routeExplicitly: true, unclearRoute: true }),
  );
  assert.equal(unclear.status, "blocked");
  assert.deepEqual(unclear.toolsUsed, []);

  const routed = runAgent(
    "tokyo-weekend",
    defaultConfig({ routeExplicitly: true, unclearRoute: false }),
  );
  assert.deepEqual(routed.toolsUsed, ["weather"]);
  assert.ok(routed.steps.some((step) => step.title === "Router"));
});

test("dropping the grounding assertion skips the tool", () => {
  const dropped = runAgent("tokyo-weekend", defaultConfig({ dropAssertion: true }));
  assert.deepEqual(dropped.toolsUsed, []);

  const checked = runAgent(
    "tokyo-weekend",
    defaultConfig({ assertGrounding: true }),
  );
  assert.deepEqual(checked.toolsUsed, ["weather"]);
  assert.ok(checked.steps.some((step) => step.title === "Grounding assertion"));
});

test("reject does not reserve and approve is idempotent", () => {
  const rejected = runAgent(
    "book-room",
    defaultConfig({ awaitApproval: true, approveWrite: false }),
  );
  assert.equal(rejected.status, "blocked");
  assert.deepEqual(rejected.toolsUsed, []);

  const approved = runAgent(
    "book-room",
    defaultConfig({ awaitApproval: true, approveWrite: true }),
  );
  assert.equal(approved.toolsUsed.filter((tool) => tool === "rooms").length, 1);
  assert.match(approved.answer ?? "", /did not book it twice/);
});

test("a widened weather handoff is rejected", () => {
  const wide = runAgent(
    "tokyo-weekend",
    defaultConfig({ handoffCheck: true, widenHandoff: true }),
  );
  assert.equal(wide.status, "blocked");
  assert.deepEqual(wide.toolsUsed, []);

  const ticket = runAgent(
    "tokyo-weekend",
    defaultConfig({ handoffCheck: true, widenHandoff: false }),
  );
  assert.deepEqual(ticket.toolsUsed, ["weather"]);
});

test("a confident sentence without a tool fails the eval", () => {
  const failed = runAgent(
    "tokyo-weekend",
    defaultConfig({ checkTrajectory: true, failEval: true }),
  );
  assert.equal(failed.status, "blocked");
  assert.match(failed.steps.at(-1)?.body ?? "", /no weather call/);

  const passed = runAgent(
    "tokyo-weekend",
    defaultConfig({ checkTrajectory: true, failEval: false }),
  );
  assert.equal(passed.status, "answered");
  assert.ok(passed.steps.some((step) => step.title === "Eval passed"));
});

test("obeying tool text reserves East", () => {
  const ignored = runAgent(
    "tokyo-weekend",
    defaultConfig({ injectionCheck: true, obeyInjection: false }),
  );
  assert.deepEqual(ignored.toolsUsed, ["weather"]);
  assert.doesNotMatch(ignored.answer ?? "", /Reserved East/);

  const obeyed = runAgent(
    "tokyo-weekend",
    defaultConfig({ injectionCheck: true, obeyInjection: true }),
  );
  assert.ok(obeyed.toolsUsed.includes("rooms"));
  assert.match(obeyed.answer ?? "", /Reserved East/);
});

test("a token in the prompt refuses the call", () => {
  const leaked = runAgent("book-room", defaultConfig({ leakSecret: true }));
  assert.equal(leaked.status, "blocked");
  assert.deepEqual(leaked.toolsUsed, []);
  assert.match(leaked.steps.at(-1)?.body ?? "", /token/);
});

test("memory recalls a prior west-room note and skips the conflict path", () => {
  const first = runAgent(
    "book-room",
    defaultConfig({ memory: true, injectFailure: true }),
  );
  assert.ok(first.notes[0]);

  const second = runAgent(
    "book-room",
    defaultConfig({ memory: true }),
    first.notes,
  );
  assert.ok(second.steps.some((step) => step.kind === "memory"));
  assert.ok(second.steps.every((step) => step.kind !== "replan"));
  assert.match(second.answer ?? "", /West/);
});
