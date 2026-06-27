import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTryonPlan, OUTER_LAYER_PROMPT } from "./fashn.ts";

// Compact summary of a plan step:
//   "Skirt:max/bottoms"    → tryon-max, category=bottoms, no prompt
//   "Jacket:max/prompt"    → tryon-max, preservation prompt (Case 5b)
//   "Dress:v1.6/one-pieces"→ tryon-v1.6, category=one-pieces (Case 5a only)
function summarize(types: string[]): string[] {
  return buildTryonPlan(types.map((type) => ({ type }))).map((step) => {
    if (step.useMax && step.prompt) return `${step.garment.type}:max/prompt`;
    if (step.useMax)                return `${step.garment.type}:max/${step.category}`;
    return                                 `${step.garment.type}:v1.6/${step.category}`;
  });
}

// ── Case 1: single garments ───────────────────────────────────────────────────
// All single garments use tryon-max (replicating the "good period" model).

test("Single Jacket → max/tops", () => {
  assert.deepEqual(summarize(["Jacket"]), ["Jacket:max/tops"]);
});

test("Single Top → max/tops", () => {
  assert.deepEqual(summarize(["Top / Shirt"]), ["Top / Shirt:max/tops"]);
});

test("Single Skirt → max/bottoms", () => {
  assert.deepEqual(summarize(["Skirt"]), ["Skirt:max/bottoms"]);
});

test("Single Pants → max/bottoms", () => {
  assert.deepEqual(summarize(["Pants"]), ["Pants:max/bottoms"]);
});

test("Single Dress → max/one-pieces", () => {
  assert.deepEqual(summarize(["Dress"]), ["Dress:max/one-pieces"]);
});

test("Single One Piece → max/one-pieces", () => {
  assert.deepEqual(summarize(["One Piece"]), ["One Piece:max/one-pieces"]);
});

// ── Case 2: Top + Bottom ─────────────────────────────────────────────────────

test("Top + Skirt → both max", () => {
  assert.deepEqual(summarize(["Top / Shirt", "Skirt"]), [
    "Top / Shirt:max/tops",
    "Skirt:max/bottoms",
  ]);
});

test("Top + Pants → both max", () => {
  assert.deepEqual(summarize(["Top / Shirt", "Pants"]), [
    "Top / Shirt:max/tops",
    "Pants:max/bottoms",
  ]);
});

// ── Case 3: Top + Jacket ─────────────────────────────────────────────────────

test("Top + Jacket (no bottom) → both max/tops", () => {
  assert.deepEqual(summarize(["Jacket", "Top / Shirt"]), [
    "Top / Shirt:max/tops",
    "Jacket:max/tops",
  ]);
});

// ── Case 4: Jacket + separable bottom ────────────────────────────────────────
// Baseline order (bottom first, jacket last), both tryon-max with category.
// Replicates the model used during the "good period" (commits 95cbec4→d873473).

test("Jacket + Skirt → skirt max first, jacket max last", () => {
  assert.deepEqual(summarize(["Jacket", "Skirt"]), [
    "Skirt:max/bottoms",
    "Jacket:max/tops",
  ]);
});

test("Skirt + Jacket → identical plan regardless of selection order", () => {
  assert.deepEqual(summarize(["Skirt", "Jacket"]), [
    "Skirt:max/bottoms",
    "Jacket:max/tops",
  ]);
});

test("Jacket + Pants → pants max first, jacket max last", () => {
  assert.deepEqual(summarize(["Jacket", "Pants"]), [
    "Pants:max/bottoms",
    "Jacket:max/tops",
  ]);
});

test("Top + Skirt + Jacket → top max, skirt max, jacket max last", () => {
  assert.deepEqual(summarize(["Jacket", "Skirt", "Top / Shirt"]), [
    "Top / Shirt:max/tops",
    "Skirt:max/bottoms",
    "Jacket:max/tops",
  ]);
});

// ── Case 5: connected full-body + jacket — UNCHANGED ─────────────────────────
// Dress/One Piece step: v1.6 (preserves neckline construction).
// Jacket step: tryon-max + OUTER_LAYER_PROMPT (experimental).

test("Dress + Jacket → dress v1.6 first, jacket max+prompt last (unchanged)", () => {
  assert.deepEqual(summarize(["Jacket", "Dress"]), [
    "Dress:v1.6/one-pieces",
    "Jacket:max/prompt",
  ]);
});

test("One Piece + Jacket → one-piece v1.6 first, jacket max+prompt last (unchanged)", () => {
  assert.deepEqual(summarize(["Jacket", "One Piece"]), [
    "One Piece:v1.6/one-pieces",
    "Jacket:max/prompt",
  ]);
});

test("Dress + Pants + Jacket → pants dropped, dress v1.6, jacket max+prompt", () => {
  assert.deepEqual(summarize(["Pants", "Dress", "Jacket"]), [
    "Dress:v1.6/one-pieces",
    "Jacket:max/prompt",
  ]);
});

// ── Prompt integrity ─────────────────────────────────────────────────────────

test("Case 5b jacket step carries the preservation prompt", () => {
  const plan = buildTryonPlan([{ type: "Dress" }, { type: "Jacket" }]);
  const jacketStep = plan.find((s) => s.garment.type === "Jacket");
  assert.equal(jacketStep?.useMax, true);
  assert.equal(jacketStep?.prompt, OUTER_LAYER_PROMPT);
});

test("Case 4 jacket step uses tryon-max without prompt", () => {
  const plan = buildTryonPlan([{ type: "Jacket" }, { type: "Skirt" }]);
  const jacketStep = plan.find((s) => s.garment.type === "Jacket");
  assert.equal(jacketStep?.useMax,    true);
  assert.equal(jacketStep?.prompt,    undefined);
  assert.equal(jacketStep?.category,  "tops");
});

test("Case 5a dress step stays v1.6 even though jacket uses max", () => {
  const plan = buildTryonPlan([{ type: "Jacket" }, { type: "Dress" }]);
  const dressStep = plan.find((s) => s.garment.type === "Dress");
  assert.equal(dressStep?.useMax,   false);
  assert.equal(dressStep?.category, "one-pieces");
});
