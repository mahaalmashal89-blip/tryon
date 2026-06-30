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
  const mobileRef = useRef<HTMLDivElement>(null);
  const scrollAncestor = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Also lock the nearest scrollable ancestor (app uses overflow-y-auto on the
      // content container, not body — body lock alone doesn't prevent background scroll)
      let el: HTMLElement | null = mobileRef.current?.parentElement ?? null;
      while (el && el !== document.body) {
        const oy = window.getComputedStyle(el).overflowY;
        if (oy === "auto" || oy === "scroll") {
          el.style.overflowY = "hidden";
          scrollAncestor.current = el;
          break;
        }
        el = el.parentElement;
      }
    } else {
      document.body.style.overflow = "";
      if (scrollAncestor.current) {
        scrollAncestor.current.style.overflowY = "";
        scrollAncestor.current = null;
      }
    }
    return () => {
      document.body.style.overflow = "";
      if (scrollAncestor.current) {
        scrollAncestor.current.style.overflowY = "";
        scrollAncestor.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const header = (
    <>
      {/* Pull handle — mobile only */}
      <div className="md:hidden flex justify-center pt-[12px] pb-[4px] flex-none">
        <div className="w-[36px] h-[4px] rounded-full bg-[rgba(20,16,22,0.12)]" />
      </div>
      {/* Title row */}
      <div
        className="flex items-center justify-between px-[24px] py-[14px] flex-none"
        style={{ borderBottom: "1px solid rgba(20,16,22,0.08)" }}
      >
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
    </>
  );

  const scrollableContent = (
    <div className="overflow-y-auto flex-1 px-[24px] py-[20px]">
      {children}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />

      {/* ── Mobile: bottom sheet ── */}
      <div
        ref={mobileRef}
        role="dialog"
        aria-modal="true"
        dir={dir}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] max-h-[88vh] flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        {header}
        {scrollableContent}
      </div>

      {/* ── Desktop: centered modal ── */}
      <div
        role="dialog"
        aria-modal="true"
        dir={dir}
        className="hidden md:flex fixed inset-0 z-50 items-center justify-center transition-opacity duration-200 ease-out"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="bg-white rounded-[20px] w-[520px] max-w-[90vw] max-h-[80vh] flex flex-col shadow-[0_24px_64px_rgba(20,16,22,0.18)] transition-transform duration-200 ease-out"
          style={{ transform: open ? "scale(1)" : "scale(0.96)" }}
        >
          {header}
          {scrollableContent}
        </div>
      </div>
    </>
  );
}
