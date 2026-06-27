import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTryonPlan, OUTER_LAYER_PROMPT } from "./fashn.ts";

// Compact view of a plan: one entry per step.
//   "Skirt:v1.6/bottoms" → tryon-v1.6, category=bottoms
//   "Jacket:max"         → tryon-max with preservation prompt
function summarize(types: string[]): string[] {
  return buildTryonPlan(types.map((type) => ({ type }))).map((step) =>
    step.useMax
      ? `${step.garment.type}:max`
      : `${step.garment.type}:v1.6/${step.category}`
  );
}

// ── Case 4: separable garments, jacket + bottom ─────────────────────────────
// Baseline order (commit dfd6c89, restored): bottom first, jacket last. Both
// v1.6. This is the order that produced the best garment fidelity in real use.

test("Jacket + Skirt → skirt v1.6 first, then jacket v1.6 last (baseline)", () => {
  assert.deepEqual(summarize(["Jacket", "Skirt"]), [
    "Skirt:v1.6/bottoms",
    "Jacket:v1.6/tops",
  ]);
});

test("Skirt + Jacket → identical plan regardless of selection order", () => {
  assert.deepEqual(summarize(["Skirt", "Jacket"]), [
    "Skirt:v1.6/bottoms",
    "Jacket:v1.6/tops",
  ]);
});

test("Jacket + Pants → pants v1.6 first, then jacket v1.6 last (baseline)", () => {
  assert.deepEqual(summarize(["Jacket", "Pants"]), [
    "Pants:v1.6/bottoms",
    "Jacket:v1.6/tops",
  ]);
});

test("Top + Skirt + Jacket → top, skirt, then jacket last", () => {
  assert.deepEqual(summarize(["Jacket", "Skirt", "Top / Shirt"]), [
    "Top / Shirt:v1.6/tops",
    "Skirt:v1.6/bottoms",
    "Jacket:v1.6/tops",
  ]);
});

test("Top + Pants + Jacket → top, pants, then jacket last", () => {
  assert.deepEqual(summarize(["Pants", "Jacket", "Top / Shirt"]), [
    "Top / Shirt:v1.6/tops",
    "Pants:v1.6/bottoms",
    "Jacket:v1.6/tops",
  ]);
});

// ── Connected full-body + jacket ─────────────────────────────────────────────
// Jacket step uses tryon-max because v1.6 category="tops" destroys the
// neckline / construction of a connected one-piece or dress.

test("Dress + Jacket → dress v1.6 first, jacket via tryon-max last", () => {
  assert.deepEqual(summarize(["Jacket", "Dress"]), [
    "Dress:v1.6/one-pieces",
    "Jacket:max",
  ]);
});

test("One Piece + Jacket → one-piece v1.6 first, jacket via tryon-max last", () => {
  assert.deepEqual(summarize(["Jacket", "One Piece"]), [
    "One Piece:v1.6/one-pieces",
    "Jacket:max",
  ]);
});

test("Dress + Pants + Jacket → pants dropped, dress base, jacket via max", () => {
  assert.deepEqual(summarize(["Pants", "Dress", "Jacket"]), [
    "Dress:v1.6/one-pieces",
    "Jacket:max",
  ]);
});

// ── Edge cases ───────────────────────────────────────────────────────────────

test("Jacket alone → plain v1.6 tops (no bottom to protect)", () => {
  assert.deepEqual(summarize(["Jacket"]), ["Jacket:v1.6/tops"]);
});

test("Top + Jacket (no bottom) → both v1.6/tops", () => {
  assert.deepEqual(summarize(["Jacket", "Top / Shirt"]), [
    "Top / Shirt:v1.6/tops",
    "Jacket:v1.6/tops",
  ]);
});

test("Single Skirt → v1.6 bottoms", () => {
  assert.deepEqual(summarize(["Skirt"]), ["Skirt:v1.6/bottoms"]);
});

// ── Prompt integrity ─────────────────────────────────────────────────────────

test("Dress + Jacket max step carries the preservation prompt", () => {
  const plan = buildTryonPlan([{ type: "Dress" }, { type: "Jacket" }]);
  const jacketStep = plan.find((s) => s.garment.type === "Jacket");
  assert.equal(jacketStep?.useMax, true);
  assert.equal(jacketStep?.prompt, OUTER_LAYER_PROMPT);
});

test("Jacket + Skirt jacket step is v1.6 (not max) — tryon-max reserved for Case 5 only", () => {
  const plan = buildTryonPlan([{ type: "Jacket" }, { type: "Skirt" }]);
  const jacketStep = plan.find((s) => s.garment.type === "Jacket");
  assert.equal(jacketStep?.useMax, false);
  assert.equal(jacketStep?.category, "tops");
});

test("Jacket + Pants jacket step is v1.6 (not max) — separables never use tryon-max", () => {
  const plan = buildTryonPlan([{ type: "Jacket" }, { type: "Pants" }]);
  const jacketStep = plan.find((s) => s.garment.type === "Jacket");
  assert.equal(jacketStep?.useMax, false);
  assert.equal(jacketStep?.category, "tops");
});
