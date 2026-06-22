"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PrivacyModal } from "@/components/layout/PrivacyModal";
import { tryonSession } from "@/lib/tryonSession";

export function TryOnUploadScreen() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [agreed,      setAgreed]      = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState(tryonSession.getUserPhotoPreviewUrl());

  const ink  = "#141016";
  const lav  = "var(--lav)";
  const lime = "var(--lime)";
  const line = "rgba(20,16,22,0.12)";

  function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    tryonSession.setUserPhoto(file);
    setPreviewUrl(tryonSession.getUserPhotoPreviewUrl());
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  function handleContinue() {
    if (!agreed) return;
    if (!previewUrl) {
      fileRef.current?.click();
      return;
    }
    router.push("/tryon/outfit");
  }

  const hasPhoto = Boolean(previewUrl);
  const canContinue = agreed && hasPhoto;

  return (
    <>
      <section className="min-h-full flex flex-col px-[20px] pt-[20px] pb-[calc(22px+env(safe-area-inset-bottom))] box-border animate-fade md:max-w-[680px] md:mx-auto md:w-full md:px-[40px] md:pt-[40px] md:pb-[40px]">
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

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Upload zone — flex-1 so it fills all space between header and bottom cards */}
        <button
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="mt-[14px] flex-1 min-h-[260px] border-[1.5px] border-dashed rounded-[18px] cursor-pointer flex flex-col items-center justify-center gap-[10px] overflow-hidden relative"
          style={{
            borderColor: hasPhoto ? "var(--lav)" : "rgba(20,16,22,0.22)",
            background: hasPhoto ? "transparent" : undefined,
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Your photo"
              className="absolute inset-0 w-full h-full object-contain object-center"
            />
          ) : (
            <div className="hatch-light absolute inset-0 flex flex-col items-center justify-center gap-[10px]">
              <div className="w-[48px] h-[48px] rounded-full bg-[#141016] text-white flex items-center justify-center text-[22px]">
                +
              </div>
              <span className="font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016]">
                Tap to upload a full-body photo
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.06em] text-[#B6ADA8]">
                JPG / PNG · best results: front-facing, good light
              </span>
            </div>
          )}

          {/* Change photo overlay (shown when photo already selected) */}
          {hasPhoto && (
            <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 bg-[rgba(20,16,22,0.7)] text-white px-[14px] py-[6px] rounded-full font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase whitespace-nowrap">
              Tap to change photo
            </div>
          )}
        </button>

        {/* Profile nudge */}
        <button
          onClick={() => router.push("/profile-setup?ctx=menu")}
          className="mt-[10px] flex items-center justify-between px-[16px] py-[11px] rounded-[14px] cursor-pointer border"
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
        <div className="mt-[10px] border border-[rgba(20,16,22,0.1)] rounded-[16px] p-[12px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6px]">
              <span className="text-[13px]">🔒</span>
              <span className="font-[family-name:var(--font-grotesk)] font-bold text-[13px] text-[#141016]">
                Privacy First
              </span>
            </div>
            <button
              onClick={() => setPrivacyOpen(true)}
              className="border-none bg-none p-0 cursor-pointer font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#141016] underline"
            >
              View details
            </button>
          </div>
          <ul className="m-0 mt-[8px] p-0 list-none flex flex-col gap-[4px]">
            {[
              "Photos are used for analysis only.",
              "Results are generated using AI.",
              "Results may differ from reality.",
            ].map((item) => (
              <li
                key={item}
                className="font-[family-name:var(--font-grotesk)] text-[12px] leading-[1.4] text-[#6B6470] pl-[14px] relative"
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

          {/* Checkbox row */}
          <button
            onClick={() => setAgreed((a) => !a)}
            className="mt-[10px] w-full flex items-center gap-[10px] border-none bg-none p-0 cursor-pointer text-left"
          >
            <span
              className="w-[20px] h-[20px] flex-none rounded-[6px] flex items-center justify-center text-[12px] text-[#141016] transition-all duration-150"
              style={{
                border: `1.5px solid ${agreed ? lime : line}`,
                background: agreed ? lime : "#fff",
              }}
            >
              {agreed ? "✓" : ""}
            </span>
            <span className="font-[family-name:var(--font-grotesk)] text-[12px] leading-[1.4] text-[#141016]">
              I have read and agree to the Image Usage &amp; Privacy Policy.
            </span>
          </button>
        </div>

        <div className="h-[10px]" />

        <button
          onClick={handleContinue}
          className="w-full box-border py-[17px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] transition-all duration-150"
          style={{
            background: canContinue ? lav : agreed ? "#E7E1DE" : "#E7E1DE",
            color: canContinue ? ink : "#B6ADA8",
            cursor: agreed ? "pointer" : "not-allowed",
          }}
        >
          {hasPhoto ? "Continue →" : agreed ? "Select a photo first" : "Continue →"}
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
