"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { Chrome } from "@/components/layout/Chrome";
import { SlideMenu } from "@/components/layout/SlideMenu";

const BACK_PATHS = [
  "/tryon/upload",
  "/tryon/outfit",
  "/tryon/analyzing",
  "/tryon/results",
  "/wardrobe",
  "/color-analysis",
  "/profile-setup",
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const showBack = BACK_PATHS.includes(pathname);

  return (
    <PhoneShell>
      <Chrome showBack={showBack} onMenuToggle={() => setMenuOpen((o) => !o)} />
      <div className="flex-1 overflow-y-auto relative">
        {/* Global desktop centering — all app screens inherit this constraint */}
        <div className="min-h-full w-full md:max-w-[880px] md:mx-auto">
          {children}
        </div>
      </div>
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </PhoneShell>
  );
}
