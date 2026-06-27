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

// ── Separable garments: jacket + bottom ─────────────────────────────────────
// Both v1.6. Jacket applied BEFORE bottoms so the tops call doesn't regenerate
// the waist and restore the original trousers. Empirically verified via A/B
// test and execution trace.

test("Jacket + Skirt → jacket v1.6 first, then skirt v1.6 last", () => {
  assert.deepEqual(summarize(["Jacket", "Skirt"]), [
    "Jacket:v1.6/tops",
    "Skirt:v1.6/bottoms",
  ]);
});

test("Skirt + Jacket → identical plan regardless of selection order", () => {
  assert.deepEqual(summarize(["Skirt", "Jacket"]), [
    "Jacket:v1.6/tops",
    "Skirt:v1.6/bottoms",
  ]);
});

test("Jacket + Pants → jacket v1.6 first, pants v1.6 last", () => {
  assert.deepEqual(summarize(["Jacket", "Pants"]), [
    "Jacket:v1.6/tops",
    "Pants:v1.6/bottoms",
  ]);
});

test("Top + Skirt + Jacket → top, jacket, then skirt last", () => {
  assert.deepEqual(summarize(["Jacket", "Skirt", "Top / Shirt"]), [
    "Top / Shirt:v1.6/tops",
    "Jacket:v1.6/tops",
    "Skirt:v1.6/bottoms",
  ]);
});

test("Top + Pants + Jacket → top, jacket, then pants last", () => {
  assert.deepEqual(summarize(["Pants", "Jacket", "Top / Shirt"]), [
    "Top / Shirt:v1.6/tops",
    "Jacket:v1.6/tops",
    "Pants:v1.6/bottoms",
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

test("Jacket + Skirt jacket step is v1.6 (not max) — tryon-max proven unreliable for separables", () => {
  const plan = buildTryonPlan([{ type: "Jacket" }, { type: "Skirt" }]);
  const jacketStep = plan.find((s) => s.garment.type === "Jacket");
  assert.equal(jacketStep?.useMax, false);
  assert.equal(jacketStep?.category, "tops");
});
