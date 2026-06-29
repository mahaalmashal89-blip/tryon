import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent, newRequestId } from "@/lib/securityLogger";

// ── Model ────────────────────────────────────────────────────────────────────
const DEFAULT_MODEL = "openai/gpt-4o";

// ── Output schema ─────────────────────────────────────────────────────────────
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
    rating:       z.string(),
    palette_type: z.string(),
    detail:       z.string(),
  }),
  personal_color_analysis: z.object({
    color_type:    z.string(),
    reason:        z.string(),
    outfit_advice: z.string(),
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
    verdict:   z.enum(["worth_it", "maybe", "skip"]),
    label:     z.string(),
    reasoning: z.string(),
  }),
});

const DualReportSchema = z.object({
  en: StyleReportSchema,
  ar: StyleReportSchema,
});

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional fashion stylist giving honest, useful advice. Your job is to help users make better fashion decisions — not to make them feel good about every outfit.

HONESTY RULE
Never flatter. If an outfit is unbalanced, poorly styled, or colour-clashing, say so directly but politely.
If an outfit is excellent, explain exactly why — do not just say "great look".
Sound like a trusted professional, not a salesperson.

PLAIN ENGLISH RULE (for the "en" version)
Write like you are explaining to a friend who is not a fashion expert.
Short sentences. Every word must be simple.
NEVER use: silhouette, palette, monochrome, cohesion, sartorial, elongate, muted, hues, ensemble.
USE INSTEAD:
- "silhouette" → "shape of the outfit" or "how the outfit looks"
- "monochrome" → "all one colour" or say the actual colour
- "elongate" → "make the outfit look longer" or "make you look taller"
- "cohesion" → "go together" or "work together"
- "muted" → "soft" or say the colour name

Good English examples:
✓ "Black and white work well together."
✓ "The jacket is too heavy for the skirt."
✓ "Keep jewellery simple so the dress stands out."
✓ "Pointed shoes will make the outfit look longer and cleaner."
✓ "The pieces go together naturally."
✗ "Monochromatic contrast creates visual interest."
✗ "The silhouette lacks definition."
✗ "Cohesive palette with muted earth hues."

GULF ARABIC RULE (for the "ar" version)
Write in friendly Gulf Arabic — the everyday language used in Kuwait, UAE, and Saudi Arabia.
Sound like a stylist texting a Khaleeji friend. Warm, short, and direct.
NOT formal Modern Standard Arabic. NOT stiff. NOT like a news article.

Good Gulf Arabic examples:
✓ "الأبيض والأسود متناسقين وواضحين."
✓ "خللي الإكسسوارات بسيطة عشان الفستان يبرز."
✓ "الحذاء المدبب يعطي الإطلالة طول وترتيب أكثر."
✓ "هذي الجاكيت تنفع مع بناطيل وتنانير وراحة."
✗ "يتسم هذا الزي بالتناسق اللوني والتكامل الجمالي." (too formal)

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

Final score = sum of all five. Be honest. Not every outfit deserves 80+.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — PERSONAL COLOR ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyse the user's visible skin tone TOGETHER with the outfit colours in this specific photo.
This is NOT a permanent season diagnosis. Always hedge your language.

HEDGING RULE — start sentences with phrases like:
"Based on this photo…" / "In this outfit…" / "Your skin appears…" / "This outfit suggests…"
Never say: "You are a Warm Autumn." Use: "In this photo, your skin appears warm."

Output three things for "personal_color_analysis":

1. "color_type" — the most likely seasonal colour type based on what you see.
   Only assign a type if you are confident.
   Types: Warm Autumn, True Autumn, Soft Autumn, Deep Autumn, True Spring, Light Spring, Warm Spring,
          Light Summer, True Summer, Cool Summer, Deep Winter, True Winter, Cool Winter
   If not confident:
     EN → "Could not determine confidently."
     AR → "لا يمكن التحديد بثقة."
   AR type equivalents: خريف دافئ, خريف أصيل, خريف ناعم, خريف عميق, ربيع أصيل, ربيع خفيف, ربيع دافئ,
                        صيف خفيف, صيف أصيل, صيف بارد, شتاء عميق, شتاء أصيل, شتاء بارد

2. "reason" — one sentence, max 20 words, starting with a hedged phrase.
   EN: "Your skin appears warm and golden in this photo."
   AR: "يبدو لونك دافئاً وذهبياً في هذه الصورة."

3. "outfit_advice" — one sentence of specific advice about THIS outfit's colours against the user's skin.
   Always reference the actual colours worn. Be honest.
   EN: "The camel blazer complements your skin naturally." / "The cool grey looks slightly off against your warm skin."
   AR: "الجاكيت الكاميل يكمل لون بشرتك بشكل طبيعي." / "الرمادي البارد لا يتناسب تماماً مع دفء بشرتك."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — COLOUR RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Give 1–3 specific colour suggestions for FUTURE outfits. Shopping recommendations — help the user build a better wardrobe.
Each must be a complete sentence. Be specific about the colour and explain why.
✓ "Olive green would add depth and work well with your warm tones."
✓ "Deep navy would create stronger contrast than the current dark shade."
✗ "Try a bright colour." (too vague)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — STYLING TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Give 1–3 specific styling tips based entirely on what you see in the image. Never give generic advice.
Every tip must reference the actual outfit.
✓ "Add a slim belt — the waist looks shapeless without it."
✓ "The jacket sleeves are too long. Rolling them once would look cleaner."
✓ "Pointed shoes will make the outfit look longer and cleaner."
If the outfit needs no improvement, say so in one honest sentence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — SHOPPING VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Help the user spend their money wisely.
"worth_buying.verdict": exactly one of these three string values:
  "worth_it" = the item/outfit is worth buying — clearly works, versatile, or flattering
  "maybe"    = has good points but real concerns exist — depends on the user's wardrobe or needs
  "skip"     = not recommended — poor fit for the look, clashing colours, or too limited
"worth_buying.label":
  EN: exactly one of — "Worth it", "Maybe", "Skip it"
  AR: exactly one of — "يستاهل", "يمكن", "ما يستاهل"
"worth_buying.reasoning": 1–2 sentences explaining WHY, referencing the specific outfit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- "color_match.rating": EN: one word — "Great", "Good", "Okay", or "Poor" | AR: "رائع", "جيد", "مقبول", "ضعيف"
- "color_match.palette_type": 2–4 words describing the colour group (EN) or its Arabic equivalent
- "color_match.detail": max 15 words — plain honest description of how the colours look together
- "outfit_cohesion.rating": EN: "Cohesive", "Mixed", or "Clashing" | AR: "متناسق", "مختلط", "متنافر"
- "outfit_cohesion.detail": max 15 words on how well the pieces work together
- "score_reasoning": max 20 words — plain honest summary of the score
- "style_category": one short label — e.g. EN: "Casual", "Smart Casual", "Formal" | AR: "كاجوال", "كاجوال راقي", "رسمي"
- "score_notes": one short honest sentence per criterion — max 12 words each, plain language

NUMBERS AND BOOLEANS are IDENTICAL in both "en" and "ar" versions.
Only STRING VALUES differ.

Return ONLY a JSON object with exactly this structure. No markdown code blocks.

{
  "en": {
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
    "score_reasoning": "Good colours and pieces that go well together, but layering feels slightly heavy.",
    "score_notes": {
      "color_harmony": "Brown and cream work well — no tension between them.",
      "outfit_cohesion": "Both pieces go together naturally.",
      "layering": "The blazer feels a little heavy over the light skirt.",
      "visual_balance": "The long skirt balances the structured blazer well.",
      "style_suitability": "Smart casual, but needs a focal point."
    },
    "color_match": {
      "rating": "Good",
      "palette_type": "warm earth tones",
      "detail": "Brown and cream work well together without competing."
    },
    "personal_color_analysis": {
      "color_type": "Warm Autumn",
      "reason": "Your skin appears warm and golden in this photo.",
      "outfit_advice": "The brown and cream palette complements your skin tone naturally."
    },
    "outfit_cohesion": {
      "rating": "Cohesive",
      "pieces_work_together": true,
      "detail": "Both pieces share the same relaxed, elegant feel."
    },
    "style_category": "Smart Casual",
    "styling_tips": [
      "Add a slim belt — the waist looks shapeless without it.",
      "Pointed shoes will make the outfit look longer and cleaner."
    ],
    "color_recommendations": [
      "Olive green would suit your warm tones and add depth.",
      "Deep camel looks better than pure white for this colour palette."
    ],
    "worth_buying": {
      "verdict": "worth_it",
      "label": "Worth it",
      "reasoning": "This jacket is versatile — it works with trousers and skirts."
    }
  },
  "ar": {
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
    "score_reasoning": "الألوان متناسقة والقطع تكمل بعض، بس الطبقات تحتاج شوي تعديل.",
    "score_notes": {
      "color_harmony": "البني والكريمي متناسقين وما فيهم تنافر.",
      "outfit_cohesion": "القطعتين تكملان بعض بشكل طبيعي.",
      "layering": "الجاكيت ثقيلة شوي على التنورة الخفيفة.",
      "visual_balance": "التنورة الطويلة توازن الجاكيت المنظمة زين.",
      "style_suitability": "كاجوال راقي، بس يحتاج نقطة تركيز واضحة."
    },
    "color_match": {
      "rating": "جيد",
      "palette_type": "ألوان دافئة ترابية",
      "detail": "البني والكريمي متناسقين وما فيهم تنافر."
    },
    "personal_color_analysis": {
      "color_type": "خريف دافئ",
      "reason": "يبدو لونك دافئاً وذهبياً في هذه الصورة.",
      "outfit_advice": "البني والكريمي يكملان لون بشرتك بشكل طبيعي."
    },
    "outfit_cohesion": {
      "rating": "متناسق",
      "pieces_work_together": true,
      "detail": "القطعتين فيهم نفس الإحساس الأنيق والمريح."
    },
    "style_category": "كاجوال راقي",
    "styling_tips": [
      "أضيفي حزام رفيع — الخصر يحتاج تحديد.",
      "الحذاء المدبب يعطي الإطلالة طول وترتيب أكثر."
    ],
    "color_recommendations": [
      "الأخضر الزيتي يضيف عمق ويناسب ألوانك الدافئة.",
      "الكاميل الغامق أحسن من الأبيض الكامل لهذي الإطلالة."
    ],
    "worth_buying": {
      "verdict": "worth_it",
      "label": "يستاهل",
      "reasoning": "هذي الجاكيت مناسبة — تنفع مع بناطيل وتنانير وراحة."
    }
  }
}`;

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
          max_tokens: 2500,
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

Score the outfit using your rubric and return a valid JSON object with both "en" and "ar" versions as described. Focus only on the outfit — colour, style, and how the pieces work together. Do not comment on body shape, size, or fit. Numbers and booleans must be identical in both versions; only string values differ.`,
                },
              ],
            },
          ],
        },
        { signal: controller.signal },
      );

      const raw = response.choices[0]?.message.content ?? "";

      // Strip markdown code fences that some models wrap JSON in
      const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

      let parsed;
      try {
        const obj = JSON.parse(jsonText);
        // Auto-calculate missing top-level score for both versions
        for (const lang of ["en", "ar"] as const) {
          const v = obj?.[lang];
          if (v && typeof v.score === "undefined" && v.score_breakdown) {
            const b = v.score_breakdown;
            v.score = (b.color_harmony ?? 0) + (b.outfit_cohesion ?? 0) +
                      (b.layering ?? 0) + (b.visual_balance ?? 0) + (b.style_suitability ?? 0);
          }
        }
        parsed = DualReportSchema.safeParse(obj);
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
      score: report.en.score,
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
