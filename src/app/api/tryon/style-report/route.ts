import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent, newRequestId } from "@/lib/securityLogger";

// ── Model ────────────────────────────────────────────────────────────────────
// To switch models, set STYLE_REPORT_MODEL in .env.local — no other code changes needed:
//   openai/gpt-4o               → GPT-4o via OpenRouter (default — best vision quality)
//   openai/gpt-4o-mini          → faster and cheaper, slightly lower quality
//   anthropic/claude-sonnet-4-6 → Claude Sonnet via OpenRouter
//   google/gemini-flash-1.5     → Gemini Flash via OpenRouter
//   meta-llama/llama-3.2-11b-vision-instruct:free → free tier for development
const DEFAULT_MODEL = "openai/gpt-4o";

// ── Output schema ─────────────────────────────────────────────────────────────
// Use z.coerce.number() so string-typed numbers ("16") are accepted without
// failing validation — GPT-4o occasionally returns JSON with number fields
// as strings when no strict output mode is available.
const ScoreInt = z.coerce.number().int().min(0).max(20);
const BoolCoerce = z.union([
  z.boolean(),
  z.string().transform(v => v === "true" || v === "True" || v === "1" || v === "yes"),
]);

const StyleReportSchema = z.object({
  confidence: z.enum(["high", "medium", "low"]),
  confidence_reason: z.string().nullable(),
  score: z.coerce.number().int().min(0).max(100),
  score_breakdown: z.object({
    color_harmony:     ScoreInt,
    outfit_cohesion:   ScoreInt,
    layering:          ScoreInt,
    visual_balance:    ScoreInt,
    style_suitability: ScoreInt,
  }),
  score_reasoning: z.string(),
  color_match: z.object({
    rating:           z.string(),
    palette_type:     z.string(),
    seasonal_palette: z.string().nullable(),
    detail:           z.string(),
  }),
  outfit_cohesion: z.object({
    rating:               z.string(),
    pieces_work_together: BoolCoerce,
    detail:               z.string(),
  }),
  style_category: z.string(),
  styling_tips: z.array(z.string()).min(1).max(3),
  worth_buying: z.object({
    verdict:   BoolCoerce,
    label:     z.string(),
    reasoning: z.string(),
  }),
});

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a concise, consistent fashion stylist. Give honest, repeatable verdicts in plain everyday language — no jargon, no padding. A shorter, reliable report is always better than an impressive-looking one that guesses.

STEP 1 — ASSESS YOUR CONFIDENCE BEFORE ANYTHING ELSE

Look at the image and decide how clearly you can see the outfit:

high   = Outfit is clearly visible, colors are distinguishable, all pieces are identifiable
medium = Outfit is mostly visible but some details are unclear (lighting, angle, partial crop)
low    = Image is too dark, blurry, heavily cropped, or the outfit cannot be reliably analyzed

Set "confidence" to one of: "high", "medium", "low"
Set "confidence_reason" to a short plain-English reason ONLY if confidence is medium or low (e.g. "Image is too dark to see colors clearly"). Otherwise set it to null.

STEP 2 — ADJUST YOUR REPORT TO MATCH YOUR CONFIDENCE

If confidence is LOW:
- Set score_breakdown values conservatively (do not invent detail you cannot see)
- Set color_match.seasonal_palette to null always
- Return only 1 styling tip, kept very general
- Keep worth_buying.reasoning to one cautious sentence
- Do not make specific color or style claims you are not sure about

If confidence is MEDIUM:
- Set color_match.seasonal_palette to null unless the season is obvious from what you can see
- Return 2 styling tips
- Qualify any uncertain claims briefly

If confidence is HIGH:
- Full report as specified below
- Set color_match.seasonal_palette only if you are clearly confident — otherwise null

SCORING RUBRIC — apply exactly the same way every time (each criterion 0–20, total 0–100):

1. Color Harmony (0–20): Do the colors go well together?
   20 = Colors work beautifully (neutrals, or colors that naturally pair well)
   15 = Mostly works, minor tension
   10 = Colors compete and look off
   5  = Colors clash badly

2. Outfit Cohesion (0–20): Do the pieces belong in the same outfit?
   20 = Everything looks intentional and belongs together
   15 = Mostly works, one piece slightly out of place
   10 = Pieces feel like they're from different outfits
   5  = Pieces actively clash in style

3. Layering & Structure (0–20): Do the pieces sit well together visually?
   20 = Layers and proportions look balanced and deliberate
   15 = Generally good, minor proportion issue
   10 = Layering feels awkward or one piece overpowers the others
   5  = No clear structure

4. Visual Balance (0–20): Does the outfit look balanced top to bottom?
   20 = Clear focal point, well-balanced overall
   15 = Mostly balanced, one element slightly off
   10 = Leans too heavy on top or bottom
   5  = Unbalanced in multiple ways

5. Style Suitability (0–20): Does the outfit nail the style it's going for?
   20 = Perfectly achieves its style
   15 = Mostly works, one element slightly off
   10 = Style goal unclear or only partially achieved
   5  = Misses its intended style entirely

Final score = sum of all five. Be honest — not every outfit deserves a 90.

OUTPUT RULES — follow exactly:
- All text in plain English. No fashion jargon.
- "color_match.rating": one word — "Great", "Good", "Okay", or "Poor"
- "color_match.palette_type": 2–4 words, e.g. "warm earth tones", "cool neutrals"
- "color_match.detail": max 12 words describing how the colors look together
- "color_match.seasonal_palette": Spring, Summer, Autumn, or Winter — ONLY if clearly confident. Otherwise null.
- "outfit_cohesion.rating": one word — "Cohesive", "Mixed", or "Clashing"
- "outfit_cohesion.detail": max 12 words on how well the pieces work together
- "score_reasoning": max 15 words explaining the score in plain language
- "style_category": one short label, e.g. "Casual", "Smart Casual", "Formal", "Evening", "Streetwear"
- "styling_tips": 1 tip if low confidence, 2 if medium, 2 if high — each max 12 words
- "worth_buying.label": 2–3 words — "Worth it", "Maybe", or "Skip it"
- "worth_buying.reasoning": max 12 words explaining the verdict

Return ONLY a JSON object that matches exactly this structure. Use these exact field names — no additions, no renamings:

{
  "confidence": "high",
  "confidence_reason": null,
  "score": 74,
  "score_breakdown": {
    "color_harmony": 16,
    "outfit_cohesion": 15,
    "layering": 14,
    "visual_balance": 15,
    "style_suitability": 14
  },
  "score_reasoning": "Balanced neutral palette with a cohesive smart casual feel.",
  "color_match": {
    "rating": "Good",
    "palette_type": "neutral earth tones",
    "seasonal_palette": "Autumn",
    "detail": "Brown and cream pair naturally without competing."
  },
  "outfit_cohesion": {
    "rating": "Cohesive",
    "pieces_work_together": true,
    "detail": "Both pieces share the same relaxed-elegant aesthetic."
  },
  "style_category": "Smart Casual",
  "styling_tips": [
    "Add a slim belt to define the waist.",
    "Try pointed flats to elongate the silhouette."
  ],
  "worth_buying": {
    "verdict": true,
    "label": "Worth it",
    "reasoning": "Versatile and polished for multiple occasions."
  }
}

Fill in real values for the outfit in the image. Do not add extra fields. Do not wrap the JSON in markdown code blocks.`;

// ── Security ──────────────────────────────────────────────────────────────────
const ALLOWED_IMAGE_HOSTS = ["cdn.fashn.ai", "fashn.ai"];

// ── Route ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const requestId = newRequestId();
  const route = "POST /api/tryon/style-report";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "AUTH_FAILURE", route, userId: null });
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { result_image_url?: unknown; garment_types?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { result_image_url, garment_types } = body;

  if (typeof result_image_url !== "string" || !result_image_url) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // SSRF protection: only allow known FASHN CDN hostnames
  let imageHostname: string;
  try {
    imageHostname = new URL(result_image_url).hostname;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_HOSTS.some(h => imageHostname === h || imageHostname.endsWith(`.${h}`))) {
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "SSRF_BLOCKED", route, userId: user.id, detail: `host=${imageHostname}` });
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!Array.isArray(garment_types) || garment_types.length === 0) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const garmentList = (garment_types as unknown[])
    .filter((t): t is string => typeof t === "string")
    .slice(0, 8)
    .join(", ");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Style analysis is not configured." }, { status: 500 });
  }

  const model = process.env.STYLE_REPORT_MODEL ?? DEFAULT_MODEL;

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    requestId,
    event: "STYLE_REPORT_START",
    model,
    garmentTypes: garmentList,
  }));

  try {
    // OpenRouter speaks the OpenAI protocol — only baseURL changes.
    const client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000",
        "X-Title": "TryOn AI Stylist",
      },
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let report;
    try {
      const response = await client.chat.completions.create(
        {
          model,
          max_tokens: 1024,
          temperature: 0,
          seed: 42,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: result_image_url, detail: "high" },
                },
                {
                  type: "text",
                  text: `Please analyze this outfit. The garments shown are: ${garmentList}.

Score the outfit using your rubric and return a valid JSON object. Focus only on the outfit — color, style, and how the pieces work together. Do not comment on body shape, size, or fit.`,
                },
              ],
            },
          ],
        },
        { signal: controller.signal },
      );

      const raw = response.choices[0]?.message.content ?? "";

      // Strip markdown code fences that some models wrap JSON in (```json ... ```)
      const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

      // If the model omitted the top-level "score" but returned "score_breakdown",
      // calculate it so the schema validation doesn't fail on that field alone.
      let parsed;
      try {
        const obj = JSON.parse(jsonText);
        if (typeof obj?.score === "undefined" && obj?.score_breakdown) {
          const b = obj.score_breakdown;
          obj.score = (b.color_harmony ?? 0) + (b.outfit_cohesion ?? 0) +
                      (b.layering ?? 0) + (b.visual_balance ?? 0) + (b.style_suitability ?? 0);
        }
        parsed = StyleReportSchema.safeParse(obj);
      } catch {
        throw new Error("Model returned invalid JSON");
      }

      if (!parsed.success) {
        console.error("[style-report] schema validation failed:", parsed.error.flatten());
        throw new Error("Schema validation failed");
      }

      report = parsed.data;
    } finally {
      clearTimeout(timeout);
    }

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      requestId,
      event: "STYLE_REPORT_COMPLETE",
      model,
      score: report.score,
    }));

    return Response.json(report);

  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    logSecurityEvent({
      ts: new Date().toISOString(),
      requestId,
      event: "STYLE_REPORT_ERROR",
      route,
      userId: user.id,
      detail: isAbort ? "timeout" : "model_error",
    });
    return Response.json({ error: "Style analysis failed. Please try again." }, { status: 500 });
  }
}
