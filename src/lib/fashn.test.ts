import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTryonPlan, OUTER_LAYER_PROMPT } from "./fashn.ts";

// Compact view of a plan: one entry per step describing what gets sent to FASHN.
//   "Skirt:v1.6/bottoms"  → tryon-v1.6, category=bottoms
//   "Jacket:max"          → tryon-max with the outer-layer preservation prompt
function summarize(types: string[]): string[] {
  return buildTryonPlan(types.map((type) => ({ type }))).map((step) =>
    step.useMax
      ? `${step.garment.type}:max`
      : `${step.garment.type}:v1.6/${step.category}`
  );
}

test("Jacket + Skirt → top-to-bottom base, jacket outermost via max", () => {
  assert.deepEqual(summarize(["Jacket", "Skirt"]), [
    "Skirt:v1.6/bottoms",
    "Jacket:max",
  ]);
});

test("Skirt + Jacket → identical plan regardless of selection order", () => {
  assert.deepEqual(summarize(["Skirt", "Jacket"]), [
    "Skirt:v1.6/bottoms",
    "Jacket:max",
  ]);
});

test("Top + Skirt + Jacket → top, skirt, then jacket via max", () => {
  assert.deepEqual(summarize(["Jacket", "Skirt", "Top / Shirt"]), [
    "Top / Shirt:v1.6/tops",
    "Skirt:v1.6/bottoms",
    "Jacket:max",
  ]);
});

test("Dress + Jacket → dress first, jacket outermost via max", () => {
  assert.deepEqual(summarize(["Jacket", "Dress"]), [
    "Dress:v1.6/one-pieces",
    "Jacket:max",
  ]);
});

test("Pants + Jacket → pants base, jacket via max", () => {
  assert.deepEqual(summarize(["Jacket", "Pants"]), [
    "Pants:v1.6/bottoms",
    "Jacket:max",
  ]);
});

test("Top + Pants + Jacket → top, pants, then jacket via max", () => {
  assert.deepEqual(summarize(["Pants", "Jacket", "Top / Shirt"]), [
    "Top / Shirt:v1.6/tops",
    "Pants:v1.6/bottoms",
    "Jacket:max",
  ]);
});

test("Jacket alone → plain v1.6 tops (no bottom to protect)", () => {
  assert.deepEqual(summarize(["Jacket"]), ["Jacket:v1.6/tops"]);
});

test("Top + Jacket (no bottom) → v1.6 tops, no max", () => {
  assert.deepEqual(summarize(["Jacket", "Top / Shirt"]), [
    "Top / Shirt:v1.6/tops",
    "Jacket:v1.6/tops",
  ]);
});

test("Dress + Pants + Jacket → pants dropped, dress base, jacket via max", () => {
  assert.deepEqual(summarize(["Pants", "Dress", "Jacket"]), [
    "Dress:v1.6/one-pieces",
    "Jacket:max",
  ]);
});

test("the jacket max step carries the preservation prompt", () => {
  const plan = buildTryonPlan([{ type: "Skirt" }, { type: "Jacket" }]);
  const jacketStep = plan.find((s) => s.garment.type === "Jacket");
  assert.equal(jacketStep?.useMax, true);
  assert.equal(jacketStep?.prompt, OUTER_LAYER_PROMPT);
});
