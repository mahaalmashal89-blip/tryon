"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrivacyModal } from "@/components/layout/PrivacyModal";

export function TryOnUploadScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const ink = "#141016";
  const lav = "var(--lav)";
  const lime = "var(--lime)";
  const line = "rgba(20,16,22,0.12)";

  return (
    <>
      <section className="min-h-full flex flex-col px-[20px] pt-[20px] pb-[calc(22px+env(safe-area-inset-bottom))] box-border animate-fade">
        {/* Step header */}
        <div className="flex items-center gap-[10px]">
          <span
            className="font-[family-name:var(--font-bodoni)] text-[34px] leading-none"
            style={{ color: "color-mix(in srgb, var(--lav) 62%, #4E3556)" }}
          >
            1
          </span>
          <div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] uppercase text-[#9A9298]">
              Step 1 of 2
            </div>
            <h1 className="m-0 mt-[2px] font-[family-name:var(--font-bodoni)] font-medium text-[28px] leading-none text-[#141016]">
              Upload your photo
            </h1>
          </div>
        </div>

        {/* Upload zone */}
        <button className="mt-[18px] h-[240px] border-[1.5px] border-dashed border-[rgba(20,16,22,0.22)] rounded-[18px] hatch-light cursor-pointer flex flex-col items-center justify-center gap-[10px]">
          <div className="w-[48px] h-[48px] rounded-full bg-[#141016] text-white flex items-center justify-center text-[22px]">
            +
          </div>
          <span className="font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016]">
            Tap to upload a full-body photo
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.06em] text-[#B6ADA8]">
            JPG / PNG · best results: front-facing, good light
          </span>
        </button>

        {/* Profile nudge */}
        <button
          onClick={() => router.push("/profile-setup?ctx=menu")}
          className="mt-[12px] flex items-center justify-between px-[16px] py-[14px] rounded-[14px] cursor-pointer border"
          style={{
            borderColor: "color-mix(in srgb, var(--lav) 55%, #fff)",
            background: "color-mix(in srgb, var(--lav) 30%, #fff)",
          }}
        >
          <span className="font-[family-name:var(--font-grotesk)] font-medium text-[13.5px] text-[#141016] text-left">
            Update Profile Setup for better accuracy
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#141016]">
            →
          </span>
        </button>

        {/* Privacy notice */}
        <div className="mt-[16px] border border-[rgba(20,16,22,0.1)] rounded-[16px] p-[16px]">
          <div className="flex items-center gap-[8px]">
            <span className="text-[14px]">🔒</span>
            <span className="font-[family-name:var(--font-grotesk)] font-bold text-[14px] text-[#141016]">
              Privacy First
            </span>
          </div>
          <ul className="m-0 mt-[12px] p-0 list-none flex flex-col gap-[8px]">
            {[
              "Photos are used for analysis only.",
              "Results are generated using AI.",
              "Results may differ from reality.",
            ].map((item) => (
              <li
                key={item}
                className="font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.45] text-[#6B6470] pl-[16px] relative"
              >
                <span
                  className="absolute left-0"
                  style={{ color: "color-mix(in srgb, var(--lav) 62%, #4E3556)" }}
                >
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setPrivacyOpen(true)}
            className="mt-[12px] border-none bg-none p-0 cursor-pointer font-[family-name:var(--font-mono)] text-[11px] tracking-[0.1em] uppercase text-[#141016] underline"
          >
            View details
          </button>

          {/* Checkbox row */}
          <button
            onClick={() => setAgreed((a) => !a)}
            className="mt-[14px] w-full flex items-center gap-[11px] border-none bg-none p-0 cursor-pointer text-left"
          >
            <span
              className="w-[22px] h-[22px] flex-none rounded-[7px] flex items-center justify-center text-[13px] text-[#141016] transition-all duration-150"
              style={{
                border: `1.5px solid ${agreed ? lime : line}`,
                background: agreed ? lime : "#fff",
              }}
            >
              {agreed ? "✓" : ""}
            </span>
            <span className="font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.4] text-[#141016]">
              I have read and agree to the Image Usage &amp; Privacy Policy.
            </span>
          </button>
        </div>

        <div className="flex-1 min-h-[18px]" />

        <button
          onClick={() => { if (agreed) router.push("/tryon/outfit"); }}
          className="w-full box-border py-[17px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] cursor-pointer transition-all duration-150"
          style={{
            background: agreed ? lav : "#E7E1DE",
            color: agreed ? ink : "#B6ADA8",
            cursor: agreed ? "pointer" : "not-allowed",
          }}
        >
          Continue →
        </button>
      </section>

      <PrivacyModal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        onAgree={() => { setAgreed(true); setPrivacyOpen(false); }}
      />
    </>
  );
}
