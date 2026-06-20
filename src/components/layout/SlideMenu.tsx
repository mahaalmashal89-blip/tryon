"use client";

import { useRouter } from "next/navigation";

interface SlideMenuProps {
  open: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { label: "Profile Setup",  n: "04", href: "/profile-setup" },
  { label: "My Wardrobe",    n: "05", href: "/wardrobe"       },
  { label: "Color Analysis", n: "06", href: "/color-analysis" },
  { label: "Home",           n: "03", href: "/home"           },
];

export function SlideMenu({ open, onClose }: SlideMenuProps) {
  const router = useRouter();

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          background: "rgba(20,16,22,0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Panel */}
      <div
        className="absolute top-0 right-0 bottom-0 w-[80%] max-w-[320px] bg-white z-21 flex flex-col"
        style={{
          boxShadow: "-20px 0 50px -20px rgba(20,16,22,0.35)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .34s cubic-bezier(.4,0,.1,1)",
          padding: "22px 24px",
          boxSizing: "border-box",
          zIndex: 21,
        }}
      >
        <div className="flex items-center justify-between mb-[30px]">
          <span className="font-[family-name:var(--font-grotesk)] font-bold text-[18px] tracking-[0.04em] text-[#141016]">
            TRYON
          </span>
          <button
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-full border border-[rgba(20,16,22,0.12)] bg-white cursor-pointer text-[16px] text-[#141016]"
          >
            ×
          </button>
        </div>

        <nav className="flex flex-col">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="flex items-baseline gap-[14px] py-[16px] border-none border-t border-t-[rgba(20,16,22,0.08)] bg-none cursor-pointer text-left"
              style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}
            >
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#9A9298] w-[20px]">
                {item.n}
              </span>
              <span className="font-[family-name:var(--font-bodoni)] text-[26px] text-[#141016]">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <button
          onClick={() => navigate("/landing")}
          className="mt-[24px] border-none bg-none p-0 cursor-pointer font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298] text-left"
        >
          Log out →
        </button>
      </div>
    </>
  );
}
