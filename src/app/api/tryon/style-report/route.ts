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
  score_notes: z.object({
    color_harmony:     z.string(),
    outfit_cohesion:   z.string(),
    layering:          z.string(),
    visual_balance:    z.string(),
    style_suitability: z.string(),
  }).optional(),
  color_match: z.object({
    rating:                  z.string(),
    palette_type:            z.string(),
    seasonal_palette:        z.string().nullable(),
    seasonal_palette_reason: z.string().nullable(),
    detail:                  z.string(),
  }),
  outfit_cohesion: z.object({
    rating:               z.string(),
    pieces_work_together: BoolCoerce,
    detail:               z.string(),
  }),
  style_category: z.string(),
  styling_tips: z.array(z.string()).min(1).max(3),
  color_recommendations: z.array(z.string()).min(1).max(3),
  worth_buying: z.object({
    verdict:   BoolCoerce,
    label:     z.string(),
    reasoning: z.string(),
  }),
});

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional fashion stylist giving honest, useful advice. Your job is to help users make better fashion decisions — not to make them feel good about every outfit.

HONESTY RULE
Never flatter. If an outfit is unbalanced, poorly styled, or colour-clashing, say so directly but politely. Use specific language:
- "This jacket is too heavy for this skirt."
- "These colours compete with each other."
- "This look does not create a polished silhouette."
If an outfit is excellent, explain exactly why — do not just say "great look".
Sound like a trusted professional, not a salesperson.

LANGUAGE RULE
Plain everyday English only. Short sentences. No fashion jargon. Write so that someone whose first language is not English can easily understand.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — ASSESS YOUR CONFIDENCE FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Look at the image and set "confidence":
  high   = Outfit is clearly visible, colours are distinguishable, all pieces are identifiable
  medium = Mostly visible but some details are unclear (lighting, angle, partial crop)
  low    = Too dark, blurry, heavily cropped, or the outfit cannot be reliably analysed

Set "confidence_reason" to a short plain reason ONLY for medium or low. Otherwise null.

Adjust your entire report to match your confidence level:
- LOW: conservative scores, no seasonal palette, 1 general tip, 1 cautious colour recommendation
- MEDIUM: moderate detail, seasonal palette only if obvious, 2 tips, 2 colour recommendations
- HIGH: full report, seasonal palette if clearly identifiable, up to 3 tips, up to 3 colour recommendations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — SCORE THE OUTFIT HONESTLY (each criterion 0–20, total 0–100)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Color Harmony (0–20): Do the colours work well together?
   18–20 = Colours complement each other beautifully
   13–17 = Mostly works, minor tension
   8–12  = Colours compete and look off
   0–7   = Colours clash badly

2. Outfit Cohesion (0–20): Do the pieces belong in the same outfit?
   18–20 = Everything looks intentional and belongs together
   13–17 = Mostly works, one piece slightly out of place
   8–12  = Pieces feel like they are from different outfits
   0–7   = Pieces actively clash in style

3. Layering & Structure (0–20): Do the pieces sit well together visually?
   18–20 = Layers and proportions look balanced and deliberate
   13–17 = Generally good, minor proportion issue
   8–12  = Layering feels awkward or one piece overpowers the others
   0–7   = No clear structure or proportion

4. Visual Balance (0–20): Is the outfit balanced from top to bottom?
   18–20 = Clear focal point, well-balanced overall
   13–17 = Mostly balanced, one element slightly off
   8–12  = Too heavy on top or bottom
   0–7   = Unbalanced in multiple ways

5. Style Suitability (0–20): Does the outfit achieve the style it is going for?
   18–20 = Perfectly achieves its intended style
   13–17 = Mostly works, one element slightly off
   8–12  = Style goal unclear or only partially achieved
   0–7   = Misses its intended style entirely

Final score = sum of all five. Be honest. Not every outfit deserves 80+. Score what you actually see.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — SEASONAL COLOUR THEORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Seasonal palette identification is a key feature of this app. Be specific — use the 12-type system:

Spring types: Light Spring, True Spring, Warm Spring
Summer types: Light Summer, True Summer, Cool Summer
Autumn types: Soft Autumn, True Autumn, Warm Autumn, Deep Autumn
Winter types: Deep Winter, True Winter, Cool Winter

Only assign a palette if you are clearly confident from the outfit colours. Examples:
- Rich warm browns, olives, terracotta → "Warm Autumn" or "True Autumn"
- Dusty roses, soft greys, muted blues → "True Summer" or "Soft Autumn"
- Bright clear colours, crisp white → "True Spring" or "True Winter"
- Deep jewel tones, black → "Deep Winter" or "Deep Autumn"

If not confident, set seasonal_palette to null and seasonal_palette_reason to null.
If confident, set seasonal_palette_reason to a short plain-English explanation of why.
Example: "Rich warm browns and terracotta suggest a Warm Autumn palette."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — COLOUR RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Give 1–3 specific colour suggestions that would improve FUTURE outfits for this person based on what you can see. These are shopping recommendations — help the user build a better wardrobe.

Each recommendation must be a complete sentence. Be specific about the colour and explain why.
Examples:
- "Olive green would add depth and work well with your warm tones."
- "Deep navy would create stronger contrast than the current dark shade."
- "Warm camel is more flattering than pure white for this colour palette."
- "Try burgundy for an evening version of this look."

Never give generic advice like "try a bright colour". Always be specific.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — STYLING TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Give 1–3 specific styling tips based entirely on what you see in the image. Never give generic advice.

Every tip must reference the actual outfit. Examples:
- "Add a slim belt to define the waist — the current silhouette is slightly shapeless."
- "The jacket sleeves are too long. Rolling them once would look cleaner."
- "A pointed heel would balance the midi skirt better than the current flat."
- "The bag looks too small for this outfit. A structured tote would suit it better."

If the outfit needs no improvement, say so in one honest sentence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — SHOPPING VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Help the user spend their money wisely. Do not encourage every purchase.

"worth_buying.verdict": true = worth buying, false = skip or maybe
"worth_buying.label": exactly one of — "Worth it", "Maybe", or "Skip it"
"worth_buying.reasoning": 1–2 sentences explaining WHY, referencing the specific outfit.

Examples:
- "Worth it. This jacket is versatile enough to style with trousers, skirts, or jeans."
- "Maybe. The colour works well, but the proportions limit what it can be paired with."
- "Skip it. The silhouette is not balanced and will be difficult to style for most occasions."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- "color_match.rating": one word only — "Great", "Good", "Okay", or "Poor"
- "color_match.palette_type": 2–4 words, e.g. "warm earth tones", "cool neutrals"
- "color_match.detail": max 15 words on how the colours look together — be honest
- "outfit_cohesion.rating": one word — "Cohesive", "Mixed", or "Clashing"
- "outfit_cohesion.detail": max 15 words on how well the pieces work together
- "score_reasoning": max 20 words — plain explanation of the score, honest about weaknesses
- "style_category": one short label — "Casual", "Smart Casual", "Formal", "Evening", "Streetwear", "Business", etc.
- "score_notes": one short honest sentence per criterion explaining WHY that score was given — max 12 words each. If points were lost, say why specifically.

Return ONLY a JSON object with exactly this structure. Use these exact field names:

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
  "score_reasoning": "Good colour harmony and cohesion, but layering feels slightly heavy.",
  "score_notes": {
    "color_harmony": "Brown and cream are a natural pairing with no tension.",
    "outfit_cohesion": "Both pieces share the same relaxed-elegant aesthetic.",
    "layering": "The blazer feels slightly heavy over the lightweight skirt.",
    "visual_balance": "The long skirt balances the structured blazer well.",
    "style_suitability": "The look achieves smart casual but lacks a clear focal point."
  },
  "color_match": {
    "rating": "Good",
    "palette_type": "warm earth tones",
    "seasonal_palette": "Warm Autumn",
    "seasonal_palette_reason": "Rich browns and cream suggest a warm, muted Autumn palette.",
    "detail": "Brown and cream pair naturally without competing."
  },
  "outfit_cohesion": {
    "rating": "Cohesive",
    "pieces_work_together": true,
    "detail": "Both pieces share the same relaxed-elegant aesthetic."
  },
  "style_category": "Smart Casual",
  "styling_tips": [
    "Add a slim belt to define the waist — the silhouette is currently shapeless.",
    "Try pointed flats instead of round-toe to elongate the silhouette."
  ],
  "color_recommendations": [
    "Olive green would add depth and suit your warm colour palette.",
    "Deep camel works better than pure white for this palette."
  ],
  "worth_buying": {
    "verdict": true,
    "label": "Worth it",
    "reasoning": "This jacket is versatile and can be paired with both trousers and skirts."
  }
}

Do not add extra fields. Do not wrap the JSON in markdown code blocks.`;

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

  const language = typeof body.language === "string" && body.language === "ar" ? "ar" : "en";

  const ARABIC_INSTRUCTION = `

LANGUAGE REQUIREMENT: Write ALL text values in Arabic (Modern Standard Arabic — simple, clear, everyday language that non-native speakers can understand). JSON key names must stay in English. Every string value in the JSON must be in Arabic. Do not mix languages within a value.`;

  const systemPrompt = SYSTEM_PROMPT + (language === "ar" ? ARABIC_INSTRUCTION : "");

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
            { role: "system", content: systemPrompt },
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
