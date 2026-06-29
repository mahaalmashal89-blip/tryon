import { ReactNode } from "react";

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    // Mobile: full-screen white — no frame, no grey gutters
    // Desktop (md+): sand bg, centered phone frame preview
    <div className="fixed inset-0 bg-white md:flex md:items-center md:justify-center md:bg-[#E9E3DF]">
      <div
        className={[
          "relative flex flex-col overflow-hidden bg-white",
          // Mobile: fill the viewport completely
          "w-full h-full",
          // Desktop: phone frame
          "md:w-[440px] md:h-[min(920px,100dvh)]",
          "md:rounded-[30px]",
          "md:shadow-[0_40px_90px_-30px_rgba(20,16,22,0.45)]",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
