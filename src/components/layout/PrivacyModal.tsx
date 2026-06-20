"use client";

import { PRIVACY_POLICY } from "@/lib/types";

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export function PrivacyModal({ open, onClose, onAgree }: PrivacyModalProps) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 z-30 transition-opacity duration-300"
        style={{
          background: "rgba(20,16,22,0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-white flex flex-col"
        style={{
          height: "86%",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -20px 50px -20px rgba(20,16,22,0.35)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform .36s cubic-bezier(.4,0,.1,1)",
          zIndex: 31,
        }}
      >
        <div className="flex items-center justify-between px-[22px] pt-[20px] pb-[12px]">
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
            Image Usage &amp; Privacy
          </span>
          <button
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-full border border-[rgba(20,16,22,0.12)] bg-white cursor-pointer text-[16px] text-[#141016]"
          >
            ×
          </button>
        </div>

        <div className="px-[22px] overflow-y-auto flex-1">
          <h2 className="font-[family-name:var(--font-bodoni)] font-medium text-[30px] leading-none text-[#141016] mt-[6px] mb-[14px]">
            Image Usage &amp; Privacy Policy
          </h2>
          <p className="font-[family-name:var(--font-grotesk)] text-[13.5px] leading-relaxed text-[#6B6470] mb-[14px]">
            By uploading your photo, you acknowledge and agree to the following:
          </p>
          <ul className="m-0 p-0 list-none flex flex-col gap-[11px]">
            {PRIVACY_POLICY.map((text, i) => (
              <li
                key={i}
                className="font-[family-name:var(--font-grotesk)] text-[13.5px] leading-relaxed text-[#3A343C] pl-[18px] relative"
              >
                <span
                  className="absolute left-0"
                  style={{ color: "color-mix(in srgb, var(--lav) 62%, #4E3556)" }}
                >
                  —
                </span>
                {text}
              </li>
            ))}
          </ul>
          <p className="font-[family-name:var(--font-grotesk)] text-[13px] leading-relaxed text-[#9A9298] italic mt-[18px] mb-[22px]">
            By selecting "I Agree" you confirm that you have read, understood, and accepted this Image Usage &amp; Privacy Policy.
          </p>
        </div>

        <div
          className="px-[22px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-[14px]"
          style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}
        >
          <button
            onClick={onAgree}
            className="w-full box-border py-[16px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
            style={{ background: "var(--lav)" }}
          >
            I Agree
          </button>
        </div>
      </div>
    </>
  );
}
