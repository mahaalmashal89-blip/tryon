import type { ClothingType } from "@/lib/types";

export type FashnCategory = "tops" | "bottoms" | "one-pieces" | "auto";

const CATEGORY_MAP: Record<string, FashnCategory> = {
  "Jacket":      "tops",
  "Top / Shirt": "tops",
  "Pants":       "bottoms",
  "Skirt":       "bottoms",
  "Dress":       "one-pieces",
  "One Piece":   "one-pieces",
  "One Set":     "one-pieces",  // coordinated set — treated as a full-body garment
  "Other":       "tops",
};

// Lower number = applied FIRST when chaining sequential FASHN calls.
//
// This is the stable baseline order (commit dfd6c89), restored after the
// One Piece experiments. It is the physical "getting dressed" order:
//   full-body base → top → bottom → jacket (outermost, applied last)
//
// Why this order for Jacket + Skirt / Jacket + Pants (Case 4):
// This is the behavior that produced the best garment fidelity in real use.
// The bottom is applied first, then the jacket goes on as the outer layer.
// (An A/B test once suggested jacket-first prevents trouser restoration, but
// real-world testing across many runs showed bottom-first preserves the
// selected garments more faithfully, so we keep the baseline order.)
//
// Case 5 (Jacket + Dress / One Piece) keeps this same ordering but switches
// the jacket step to tryon-max — see buildTryonPlan(). That special case is
// EXPERIMENTAL and must never be applied to Skirt/Pants combinations.
const LAYER_ORDER: Record<string, number> = {
  "Dress":       0,  // full-body base — applied first
  "One Piece":   0,
  "One Set":     0,  // coordinated set (jacket+skirt/pants in one image) — base layer
  "Top / Shirt": 1,  // upper base layer
  "Pants":       2,  // bottoms over the base
  "Skirt":       2,
  "Jacket":      3,  // outerwear — applied LAST so it is the outermost layer
  "Other":       3,
};

export function getFashnCategory(type: string): FashnCategory {
  return CATEGORY_MAP[type] ?? "tops";
}

const OUTERWEAR = new Set(["Jacket", "Other"]);
const BASE_REPLACEABLE = new Set(["Top / Shirt", "Pants", "Skirt"]);

/**
 * Sort garments into the order that produces correct FASHN API results:
 *   Dress/One Piece → Top/Shirt → Jacket/Other → Pants/Skirt
 *
 * See LAYER_ORDER for the empirical reasoning behind this sequence.
 *
 * If a Dress or One Piece is present it replaces the base outfit layer
 * (Top/Shirt, Pants, Skirt are discarded), but outerwear (Jacket, Other)
 * is still applied on top.
 */
export function sortByLayer<T extends { type: ClothingType | string }>(items: T[]): T[] {
  const hasFullBody = items.some((i) => CONNECTED_FULLBODY.has(i.type));

  const filtered = hasFullBody
    ? items.filter((i) => !BASE_REPLACEABLE.has(i.type))  // drop Top/Shirt, Pants, Skirt
    : items;

  return [...filtered].sort(
    (a, b) => (LAYER_ORDER[a.type] ?? 1) - (LAYER_ORDER[b.type] ?? 1)
  );
}

// Full-body garments (connected top+bottom). When one of these is present with
// a jacket, v1.6 category="tops" would destroy the neckline/construction of
// the connected garment. tryon-max with a prompt is the only FASHN-native
// option for this case.
//
// NOTE: tryon-max was also tested for Jacket + separable bottoms (Skirt/Pants)
// but the trace confirmed it ignores preservation prompts — the skirt was lost
// even when tryon-max received the correct skirt result as its input. So
// tryon-max is reserved ONLY for connected full-body garments.
// One Set is a coordinated outfit (e.g. matching jacket+skirt) shown in a single
// product image. It is treated as full-body: separable tops/bottoms are dropped
// when it is present, and it always runs as a single tryon-max call.
const CONNECTED_FULLBODY = new Set(["Dress", "One Piece", "One Set"]);

// ── Intent prompts ────────────────────────────────────────────────────────────
//
// The user-facing category is an intent signal, not a raw FASHN parameter.
// Each prompt has TWO explicit paragraphs:
//
//   § EXTRACT — what to take from the product image, and what to IGNORE in it.
//               Product images often show a full outfit on a model (e.g. jacket
//               + trousers, or top + skirt). The model must know to extract only
//               the selected garment and discard everything else in the image.
//
//   § APPLY   — where to put the extracted garment on the wearer's body, and
//               what to preserve untouched elsewhere on the wearer.
//
// Without the EXTRACT paragraph the model can apply unselected garments that
// are visually prominent in the product image (e.g. pants from a jacket photo).
//
const CATEGORY_PROMPTS: Record<string, string> = {
  "One Set":
    // EXTRACT — the product image IS the full outfit; apply everything in it.
    "This product image shows a complete coordinated two-piece outfit — it includes " +
    "both an upper garment and a matching lower garment. " +
    "Extract and apply the entire outfit exactly as shown. " +
    "Do not discard or ignore either piece. " +
    // APPLY — full-body replacement; nothing on the wearer's body is preserved.
    "Apply both the upper and lower garments to the wearer. " +
    "Do not apply only the top and leave the lower body unchanged. " +
    "Do not invent or substitute a different lower garment. " +
    "The lower garment from the product image must appear in the result.",

  "Dress":
    // EXTRACT — single full-body piece; no other garments to discard.
    "This product image shows a single full-body dress. " +
    "Extract the dress exactly as shown from neckline to hem. " +
    // APPLY — full-body replacement; preserve garment length completely.
    "Apply it to the wearer from top to bottom. " +
    "Do not truncate, shorten, or alter the lower portion of the dress.",

  "One Piece":
    // EXTRACT — single full-body piece; no other garments to discard.
    "This product image shows a single full-body one-piece garment. " +
    "Extract it exactly as shown from neckline to hem. " +
    // APPLY — full-body replacement; preserve garment length completely.
    "Apply it to the wearer from top to bottom. " +
    "Do not truncate, shorten, or alter the lower portion.",

  "Top / Shirt":
    // EXTRACT — only the top; discard any lower garment visible in the image.
    "The selected item is the top or shirt in this product image. " +
    "Extract ONLY the top from this image. " +
    "The product image may also show trousers, a skirt, or other lower garments — " +
    "ignore them completely. Do not apply any lower garment from this product image. " +
    // APPLY — upper body only; wearer's lower body is preserved exactly.
    "Apply only the extracted top to the upper body of the wearer. " +
    "Preserve all existing clothing on the wearer's lower body exactly as-is.",

  "Skirt":
    // EXTRACT — only the skirt; discard any upper garment visible in the image.
    "The selected item is the skirt in this product image. " +
    "Extract ONLY the skirt from this image. " +
    "The product image may also show a top, blouse, jacket, or other upper garments — " +
    "ignore them completely. Do not apply any upper garment from this product image. " +
    // APPLY — lower body only; wearer's upper body is preserved exactly.
    "Apply only the extracted skirt to the lower body of the wearer. " +
    "Preserve all existing clothing on the wearer's upper body exactly as-is.",

  "Pants":
    // EXTRACT — only the trousers; discard any upper garment visible in the image.
    "The selected item is the trousers in this product image. " +
    "Extract ONLY the trousers from this image. " +
    "The product image may also show a top, shirt, jacket, or other upper garments — " +
    "ignore them completely. Do not apply any upper garment from this product image. " +
    // APPLY — lower body only; wearer's upper body is preserved exactly.
    "Apply only the extracted trousers to the lower body of the wearer. " +
    "Preserve all existing clothing on the wearer's upper body exactly as-is.",

  "Jacket":
    // EXTRACT — only the jacket; discard any other garments visible in the image.
    "The selected item is the jacket or outerwear in this product image. " +
    "Extract ONLY the jacket from this image. " +
    "The product image may also show trousers, a skirt, a top, or other garments — " +
    "ignore them completely. Do not apply any non-jacket garment from this product image. " +
    // APPLY — outer layer only; everything on the wearer is preserved underneath.
    "Add only the extracted jacket as an outer layer over the wearer's existing outfit. " +
    "Preserve everything the wearer is already wearing exactly as-is — " +
    "the top, skirt, trousers, and any visible clothing underneath. " +
    "Do not replace, remove, or redesign any garment already on the wearer.",

  "Other":
    // EXTRACT — only the selected outer garment; discard other visible garments.
    "The selected item is the outer garment in this product image. " +
    "Extract ONLY that outer garment from this image. " +
    "The product image may also show other garments — ignore them. " +
    // APPLY — outer layer only; everything on the wearer is preserved.
    "Add only the extracted garment as an outer layer over the wearer's existing outfit. " +
    "Preserve all existing clothing on the wearer exactly as-is.",
};

export function getCategoryPrompt(type: string): string | undefined {
  return CATEGORY_PROMPTS[type];
}

// Kept for Case 5b only (Jacket over a connected full-body garment). This
// wording has been empirically tested in that specific chaining context and
// must not be replaced with the general Jacket prompt above without re-testing.
export const OUTER_LAYER_PROMPT =
  "Add this jacket as an open outer layer worn over the existing outfit. " +
  "Keep everything underneath exactly as-is: do not change, replace, redesign, " +
  "or remove the lower garment, the skirt, the trousers, the top, or any " +
  "visible clothing. Only add the jacket as the outermost layer. " +
  "Do not restore or invent any garment that is not already visible.";

export interface TryonStep<T> {
  garment: T;
  useMax: boolean;            // true → tryon-max, false → tryon-v1.6
  category?: FashnCategory;   // sent to tryon-v1.6; also forwarded to tryon-max when present
  prompt?: string;            // intent prompt for tryon-max (all cases except Case 5a)
}

/**
 * Build the ordered processing plan for an outfit.
 *
 * Routing rules, applied in order:
 *
 * Case 5a — connected full-body step when a jacket is also selected:
 *   Dress / One Piece → tryon-v1.6 + category (no prompt).
 *   Preserves neckline/construction before the jacket is layered in the next step.
 *
 * Case 5b — jacket step over a connected full-body garment:
 *   → tryon-max + OUTER_LAYER_PROMPT (empirically tested, unchanged).
 *
 * One Set — single tryon-max call with full-outfit intent prompt.
 *   Never split into two steps; never downgraded to v1.6.
 *
 * All other cases (Cases 1–4) — tryon-max + category + intent prompt.
 *   The intent prompt translates the user's category selection into explicit
 *   model instructions: what to apply, what to preserve, what not to invent.
 */
export function buildTryonPlan<T extends { type: ClothingType | string }>(
  items: T[]
): TryonStep<T>[] {
  const sorted = sortByLayer(items);
  const hasConnectedFullBody = sorted.some((g) => CONNECTED_FULLBODY.has(g.type));
  const hasOuterwear         = sorted.some((g) => OUTERWEAR.has(g.type));

  return sorted.map((garment) => {
    const isOuterwear = OUTERWEAR.has(garment.type);

    // One Set: a coordinated outfit in a single product image.
    // Single tryon-max call with a full-outfit intent prompt so the model
    // knows to apply both upper and lower garments — not just the top.
    if (garment.type === "One Set") {
      return { garment, useMax: true, prompt: getCategoryPrompt("One Set") };
    }

    // Case 5a: the Dress/One Piece step when a Jacket is also selected.
    // Keep v1.6 + category — it correctly applies the one-piece before the
    // jacket is layered on top via tryon-max in the next step.
    if (!isOuterwear && hasConnectedFullBody && hasOuterwear) {
      return { garment, useMax: false, category: getFashnCategory(garment.type) };
    }

    // Case 5b: Jacket/Other over a connected full-body garment.
    // tryon-max + OUTER_LAYER_PROMPT — empirically tested, unchanged.
    if (isOuterwear && hasConnectedFullBody) {
      return { garment, useMax: true, category: getFashnCategory(garment.type), prompt: OUTER_LAYER_PROMPT };
    }

    // All other cases (Cases 1–4): tryon-max + category + intent prompt.
    // The prompt converts the user's category selection into explicit model
    // instructions, reducing the chance the model invents or misapplies garments.
    return {
      garment,
      useMax:   true,
      category: getFashnCategory(garment.type),
      prompt:   getCategoryPrompt(garment.type),
    };
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
