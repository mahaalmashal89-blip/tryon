"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FEMALE_MEASURE_FIELDS,
  MALE_MEASURE_FIELDS,
  CLOTHING_SIZES,
  type ClothingSize,
} from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { validateHeight, validateWeight, validateMeasurementCm } from "@/lib/validation";
import { saveProfile, loadProfile } from "@/lib/profileStore";
import { createClient } from "@/lib/supabase/client";

type MeasureValues = Record<string, string>;
type MeasureErrors = Record<string, string>;

// Maps display label → StoredProfile key
const LABEL_TO_KEY: Record<string, keyof import("@/lib/profileStore").StoredProfile> = {
  Height:    "height",
  Weight:    "weight",
  Bust:      "bust",
  Chest:     "bust",   // male chest stored under same key
  Waist:     "waist",
  Hips:      "hips",
  Shoulders: "hips",   // male shoulders stored under same key
};

function validateField(label: string, value: string): string {
  if (label === "Height")    return validateHeight(value);
  if (label === "Weight")    return validateWeight(value);
  if (label === "Usual size") return "";
  return validateMeasurementCm(label, value);
}

export function ProfileSetupScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const ctx    = params.get("ctx") ?? "reg";

  const [gender, setGender]       = useState<"male" | "female">("female");
  const fields                    = gender === "male" ? MALE_MEASURE_FIELDS : FEMALE_MEASURE_FIELDS;
  const numericFields             = fields.filter((f) => f.label !== "Usual size");

  const [values, setValues]       = useState<MeasureValues>(() =>
    Object.fromEntries(
      FEMALE_MEASURE_FIELDS.filter((f) => f.label !== "Usual size").map((f) => [f.label, ""])
    )
  );
  const [errors, setErrors]       = useState<MeasureErrors>({});
  const [touched, setTouched]     = useState<Record<string, boolean>>({});
  const [size, setSize]           = useState<ClothingSize | "">("");
  const [sizeError, setSizeError] = useState("");

  // Resolve gender and load saved measurements on mount.
  // Gender is read exclusively from trusted Supabase sources — never from
  // the URL — to prevent a URL-manipulation attack that could cause the
  // wrong measurement fields to be shown and saved.
  useEffect(() => {
    loadProfile().then(async (saved) => {
      let resolvedGender: "male" | "female" = "female";

      if (saved) {
        resolvedGender = saved.gender;
      } else {
        // New user: profile row doesn't exist yet; read gender from auth
        // metadata that was stored during signUp().
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const meta = user?.user_metadata?.gender;
        if (meta === "male" || meta === "female") resolvedGender = meta;
      }

      setGender(resolvedGender);

      const resolvedFields = (
        resolvedGender === "male" ? MALE_MEASURE_FIELDS : FEMALE_MEASURE_FIELDS
      ).filter((f) => f.label !== "Usual size");

      setValues(
        Object.fromEntries(
          resolvedFields.map((f) => {
            const key = LABEL_TO_KEY[f.label];
            return [f.label, saved && key ? (saved[key] as string) ?? "" : ""];
          })
        )
      );

      if (saved?.size && CLOTHING_SIZES.includes(saved.size as ClothingSize)) {
        setSize(saved.size as ClothingSize);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(label: string, value: string) {
    setValues((v) => ({ ...v, [label]: value }));
    if (!touched[label]) return;
    const err = validateField(label, value);
    setErrors((e) => {
      const next = { ...e };
      if (err) next[label] = err; else delete next[label];
      return next;
    });
  }

  function handleBlur(label: string) {
    setTouched((t) => ({ ...t, [label]: true }));
    const err = validateField(label, values[label]);
    setErrors((e) => {
      const next = { ...e };
      if (err) next[label] = err; else delete next[label];
      return next;
    });
  }

  function finish() {
    const allTouched = Object.fromEntries(numericFields.map((f) => [f.label, true]));
    setTouched(allTouched);

    const newErrors: MeasureErrors = {};
    for (const f of numericFields) {
      const err = validateField(f.label, values[f.label]);
      if (err) newErrors[f.label] = err;
    }
    setErrors(newErrors);

    if (!size) setSizeError("Please select your usual size.");
    if (Object.keys(newErrors).length > 0 || !size) return;

    // Persist to Supabase
    saveProfile({
      gender,
      height: values["Height"]    ?? "",
      weight: values["Weight"]    ?? "",
      bust:   values["Bust"]      ?? values["Chest"]     ?? "",
      waist:  values["Waist"]     ?? "",
      hips:   values["Hips"]      ?? values["Shoulders"] ?? "",
      size,
    }).then(() => {
      router.push(ctx === "reg" ? "/success" : "/home");
    });
  }

  function skip() {
    router.push(ctx === "reg" ? "/success" : "/home");
  }

  return (
    <section className="min-h-full flex flex-col px-[22px] pt-[24px] pb-[calc(24px+env(safe-area-inset-bottom))] box-border animate-fade md:px-[40px] md:pt-[40px]">
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#141016]">
        Optional · for better accuracy
      </span>
      <h1 className="mt-[8px] mb-[6px] font-[family-name:var(--font-bodoni)] font-medium text-[38px] leading-[0.98] text-[#141016]">
        Your<br />measurements
      </h1>
      <p className="m-0 mb-[20px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.5] text-[#6B6470]">
        The more we know, the sharper the fit and size advice. You can always skip and add these later.
      </p>

      <div className="grid grid-cols-2 gap-[14px]">
        {numericFields.map((f) => (
          <Input
            key={f.label}
            label={f.label}
            placeholder={f.ph}
            unit={f.unit || undefined}
            value={values[f.label]}
            error={touched[f.label] ? errors[f.label] : undefined}
            inputMode="decimal"
            onChange={(e) => handleChange(f.label, e.target.value)}
            onBlur={() => handleBlur(f.label)}
          />
        ))}
      </div>

      {/* Usual Size selector */}
      <div className="mt-[14px]">
        <label className="block mb-[10px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
          Usual size
        </label>
        <div className="flex gap-[8px] flex-wrap">
          {CLOTHING_SIZES.map((s) => {
            const active = size === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setSize(s); setSizeError(""); }}
                className="min-w-[48px] h-[44px] px-[14px] rounded-[12px] border font-[family-name:var(--font-grotesk)] font-semibold text-[14px] cursor-pointer transition-colors"
                style={{
                  background:  active ? "var(--ink)" : "white",
                  color:       active ? "white"      : "var(--ink)",
                  borderColor: sizeError && !active
                    ? "rgb(248 113 113)"
                    : active
                    ? "var(--ink)"
                    : "rgba(20,16,22,0.12)",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        {sizeError && (
          <p className="mt-[5px] font-[family-name:var(--font-grotesk)] text-[12px] text-red-500 leading-snug">
            {sizeError}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-[24px]" />

      <button
        onClick={finish}
        className="w-full box-border py-[17px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
        style={{ background: "var(--lav)" }}
      >
        Save profile
      </button>
      <button
        onClick={skip}
        className="w-full box-border py-[14px] mt-[8px] border-none bg-none font-[family-name:var(--font-mono)] text-[12px] tracking-[0.1em] uppercase text-[#9A9298] cursor-pointer"
      >
        {ctx === "reg" ? "Skip for now" : "Back to home"}
      </button>
    </section>
  );
}
