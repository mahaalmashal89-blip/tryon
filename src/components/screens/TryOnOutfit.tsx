"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { CLOTHING_TYPES } from "@/lib/types";
import { useOutfitStore } from "@/hooks/useOutfitStore";
import { Chip } from "@/components/ui/Chip";

export function TryOnOutfitScreen() {
  const router = useRouter();
  const {
    items, source, setSource,
    draftType, setDraftType,
    draftUrl, setDraftUrl,
    draftPreview, fileInputRef,
    fileError, compressing,
    handleFileSelect, addItem, removeItem,
  } = useOutfitStore();

  const localFileRef = useRef<HTMLInputElement>(null);
  const ref = fileInputRef ?? localFileRef;

  const ink = "#141016";
  const lav = "var(--lav)";

  const draftReady =
    !compressing &&
    draftType !== null &&
    (source === "url" ? draftUrl.trim().length > 0 : draftPreview !== "");

  return (
    <section className="min-h-full flex flex-col px-[20px] pt-[20px] pb-[calc(22px+env(safe-area-inset-bottom))] box-border animate-fade md:px-[40px] md:pt-[40px] md:pb-[40px]">
      {/* Step header */}
      <div className="flex items-center gap-[10px]">
        <span
          className="font-[family-name:var(--font-bodoni)] text-[34px] leading-none"
          style={{ color: "color-mix(in srgb, var(--lav) 62%, #4E3556)" }}
        >
          2
        </span>
        <div>
          <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] uppercase text-[#9A9298]">
            Step 2 of 2
          </div>
          <h1 className="m-0 mt-[2px] font-[family-name:var(--font-bodoni)] font-medium text-[28px] leading-none text-[#141016]">
            Build the outfit
          </h1>
        </div>
      </div>

      <p className="mt-[14px] mb-0 font-[family-name:var(--font-grotesk)] text-[13.5px] leading-[1.45] text-[#6B6470]">
        Add every piece you want to try. The AI styles the complete look together and returns one overall report.
      </p>

      {/* Outfit list header */}
      <div className="mt-[20px] flex items-center justify-between">
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#141016]">
          Your outfit
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.08em] text-[#9A9298]">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Items */}
      <div className="mt-[10px] flex flex-col gap-[8px]">
        {items.length === 0 && (
          <div className="p-[18px] border border-dashed border-[rgba(20,16,22,0.18)] rounded-[14px] text-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.06em] text-[#B6ADA8]">
            No pieces yet — add your first below.
          </div>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center gap-[12px] p-[10px] border border-[rgba(20,16,22,0.1)] rounded-[14px]"
          >
            {/* Thumbnail */}
            <div className="w-[38px] h-[48px] flex-none rounded-[8px] border border-[rgba(20,16,22,0.06)] overflow-hidden bg-[#F4F1EF]">
              {it.previewUrl ? (
                <img src={it.previewUrl} alt={it.type} className="w-full h-full object-cover" />
              ) : it.url ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-[family-name:var(--font-mono)] text-[8px] text-[#9A9298] text-center leading-tight px-[2px]">
                    URL
                  </span>
                </div>
              ) : (
                <div className="hatch w-full h-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-[family-name:var(--font-bodoni)] text-[18px] leading-[1.1] text-[#141016] truncate">
                {it.type}
              </div>
              <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.08em] uppercase text-[#9A9298] mt-[3px] truncate">
                {it.source === "url" ? "Link" : "Image"} · {it.url ? (() => { try { return new URL(it.url).hostname.replace("www.", ""); } catch { return "link"; } })() : "uploaded"}
              </div>
            </div>

            <button
              onClick={() => removeItem(it.id)}
              className="w-[28px] h-[28px] flex-none rounded-full border border-[rgba(20,16,22,0.12)] bg-white cursor-pointer text-[#141016] text-[15px] leading-none flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="mt-[16px] border border-[rgba(20,16,22,0.1)] rounded-[16px] p-[14px]">
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#141016]">
          Add a piece
        </span>

        {true && (
          <>
            <input
              ref={ref}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { void handleFileSelect(e.target.files?.[0] ?? null); e.target.value = ""; }}
            />
            <button
              onClick={() => !compressing && ref.current?.click()}
              disabled={compressing}
              className="mt-[12px] w-full rounded-[14px] cursor-pointer overflow-hidden border-[1.5px] border-dashed disabled:cursor-wait"
              style={{
                borderColor: fileError ? "#ef4444" : draftPreview ? "var(--lav)" : "rgba(20,16,22,0.22)",
                height: draftPreview || compressing ? "auto" : "104px",
              }}
            >
              {compressing ? (
                <div className="h-[104px] flex flex-col items-center justify-center gap-[8px]">
                  <div className="w-[28px] h-[28px] rounded-full border-[3px] border-[rgba(20,16,22,0.1)] border-t-[#141016] animate-spin" />
                  <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298]">
                    Optimising…
                  </span>
                </div>
              ) : draftPreview ? (
                <div className="relative">
                  <img
                    src={draftPreview}
                    alt="Garment preview"
                    className="w-full max-h-[160px] object-contain block"
                    style={{ background: "#F4F1EF" }}
                  />
                  <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 bg-[rgba(20,16,22,0.7)] text-white px-[12px] py-[4px] rounded-full font-[family-name:var(--font-mono)] text-[9px] tracking-[0.1em] uppercase whitespace-nowrap">
                    Tap to change
                  </div>
                </div>
              ) : (
                <div className="hatch-light h-full flex flex-col items-center justify-center gap-[7px]">
                  <div className="w-[36px] h-[36px] rounded-full bg-[#141016] text-white flex items-center justify-center text-[18px]">
                    +
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.06em] text-[#B6ADA8]">
                    Upload a clothing photo
                  </span>
                </div>
              )}
            </button>
            {fileError && (
              <p className="mt-[6px] font-[family-name:var(--font-grotesk)] text-[12px] text-red-500 leading-snug">
                {fileError}
              </p>
            )}
          </>
        )}

        <div className="mt-[14px]">
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298] block mb-[10px]">
            Clothing type
          </span>
          <div className="flex flex-wrap gap-[8px]">
            {CLOTHING_TYPES.map((c) => (
              <Chip
                key={c}
                label={c}
                active={draftType === c}
                onClick={() => setDraftType(c)}
              />
            ))}
          </div>
        </div>

        <button
          onClick={addItem}
          disabled={!draftReady}
          className="w-full box-border py-[15px] mt-[14px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] transition-all duration-150"
          style={{
            background: draftReady ? ink : "#E7E1DE",
            color:      draftReady ? "#fff" : "#B6ADA8",
            cursor:     draftReady ? "pointer" : "not-allowed",
          }}
        >
          + Add item
        </button>
      </div>

      <div className="flex-1 min-h-[18px]" />

      <button
        onClick={() => { if (items.length) router.push("/tryon/analyzing"); }}
        className="w-full box-border py-[17px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] transition-all duration-150"
        style={{
          background: items.length ? lav : "#E7E1DE",
          color:      items.length ? ink : "#B6ADA8",
          cursor:     items.length ? "pointer" : "not-allowed",
        }}
      >
        Analyze the look ✦
      </button>
    </section>
  );
}
