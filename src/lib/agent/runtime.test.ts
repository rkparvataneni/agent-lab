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
