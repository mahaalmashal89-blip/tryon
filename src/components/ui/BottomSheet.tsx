"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  dir?: "ltr" | "rtl";
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, dir = "ltr", children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        dir={dir}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] max-h-[88vh] flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Pull handle */}
        <div className="flex justify-center pt-[12px] pb-[4px] flex-none">
          <div className="w-[36px] h-[4px] rounded-full bg-[rgba(20,16,22,0.12)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[14px] flex-none" style={{ borderBottom: "1px solid rgba(20,16,22,0.08)" }}>
          <h3 className="m-0 font-[family-name:var(--font-bodoni)] text-[20px] text-[#141016]">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-[#F2EEEC] border-none cursor-pointer font-[family-name:var(--font-grotesk)] text-[14px] text-[#6B6470]"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-[24px] py-[20px]">
          {children}
        </div>
      </div>
    </>
  );
}
