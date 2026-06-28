export type AuthMode = "register" | "login";
export type HeroVariant = "a" | "b";
export type ResultsVariant = "a" | "b";
export type OutfitSource = "url" | "image";
export type Gender = "male" | "female" | null;

export interface OutfitItem {
  id: number;
  name: string;
  type: string;
  source: "Link" | "Image";
}

export interface WardrobeEntry {
  id: number;
  type: string;
  src: string;
  score: number;
  verdict: "BUY" | "MAYBE" | "SKIP";
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface MeasureField {
  label: string;
  ph: string;
  unit: string;
}

export interface StyleReport {
  confidence: "high" | "medium" | "low";
  confidence_reason: string | null;
  score: number;
  score_breakdown: {
    color_harmony:     number;
    outfit_cohesion:   number;
    layering:          number;
    visual_balance:    number;
    style_suitability: number;
  };
  score_reasoning: string;
  color_match: {
    rating:           string;
    palette_type:     string;
    seasonal_palette: string | null;
    detail:           string;
  };
  outfit_cohesion: {
    rating:               string;
    pieces_work_together: boolean;
    detail:               string;
  };
  style_category: string;
  styling_tips: string[];
  worth_buying: {
    verdict:   boolean;
    label:     string;
    reasoning: string;
  };
}

export const CLOTHING_TYPES = [
  "Jacket",
  "Top / Shirt",
  "Pants",
  "Skirt",
  "Dress",
  "One Piece",
  "One Set",
  "Other",
] as const;

export type ClothingType = (typeof CLOTHING_TYPES)[number];

export const MEASURE_FIELDS: MeasureField[] = [
  { label: "Height",     ph: "170", unit: "cm" },
  { label: "Weight",     ph: "62",  unit: "kg" },
  { label: "Waist",      ph: "72",  unit: "cm" },
  { label: "Hips",       ph: "96",  unit: "cm" },
  { label: "Bust",       ph: "88",  unit: "cm" },
  { label: "Usual size", ph: "M",   unit: ""   },
];

export const FEMALE_MEASURE_FIELDS: MeasureField[] = [
  { label: "Height",     ph: "170", unit: "cm" },
  { label: "Weight",     ph: "62",  unit: "kg" },
  { label: "Bust",       ph: "88",  unit: "cm" },
  { label: "Waist",      ph: "72",  unit: "cm" },
  { label: "Hips",       ph: "96",  unit: "cm" },
  { label: "Usual size", ph: "",    unit: ""   },
];

export const MALE_MEASURE_FIELDS: MeasureField[] = [
  { label: "Height",     ph: "175", unit: "cm" },
  { label: "Weight",     ph: "78",  unit: "kg" },
  { label: "Chest",      ph: "98",  unit: "cm" },
  { label: "Waist",      ph: "82",  unit: "cm" },
  { label: "Shoulders",  ph: "46",  unit: "cm" },
  { label: "Usual size", ph: "",    unit: ""   },
];

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type ClothingSize = typeof CLOTHING_SIZES[number];

export const ANALYZE_STEPS = [
  "Reading your photo",
  "Assembling the outfit",
  "Matching colour & fit",
  "Composing the look",
];

export const STYLING_TIPS = [
  "Cuff the blazer sleeves for a relaxed line.",
  "Tuck the inner top to define the waist.",
  "Add gold accessories to echo your warm undertone.",
];

export const WARDROBE_MOCK: WardrobeEntry[] = [
  { id: 1, type: "Denim Jacket",    src: "Zara",     score: 87, verdict: "BUY"   },
  { id: 2, type: "Slip Dress",      src: "Aritzia",  score: 74, verdict: "MAYBE" },
  { id: 3, type: "Wide Trousers",   src: "COS",      score: 91, verdict: "BUY"   },
  { id: 4, type: "Ribbed Knit Top", src: "H&M",      score: 58, verdict: "SKIP"  },
];

export const GOOD_COLORS: ColorSwatch[] = [
  { name: "Coral",    hex: "#FF6F61" },
  { name: "Marigold", hex: "#F4A93B" },
  { name: "Jade",     hex: "#1FA37A" },
  { name: "Ivory",    hex: "#F3ECE2" },
  { name: "Cobalt",   hex: "#2D5BD0" },
];

export const BAD_COLORS: ColorSwatch[] = [
  { name: "Ash Grey", hex: "#9AA0A6" },
  { name: "Mauve",    hex: "#9C7B95" },
  { name: "Burgundy", hex: "#5C1F2E" },
];

export const PRIVACY_POLICY = [
  "Your photo will be used solely to generate AI-powered outfit previews, styling recommendations, and color analysis.",
  "AI-generated results are for reference only and may not reflect real-life appearance, fit, colors, proportions, or final results.",
  "Your photo may be temporarily processed by our systems and trusted third-party services required to provide TryOn features.",
  "We do not intentionally retain personal photos longer than necessary to complete the requested analysis.",
  "While we take reasonable measures to protect your information, no online service can guarantee absolute security.",
  "TryOn does not sell, rent, or intentionally share personal photos with third parties for marketing purposes.",
  "By continuing, you consent to the temporary processing of your image to provide TryOn services.",
  "TryOn is not responsible for differences between AI-generated results and real-life outcomes.",
];
