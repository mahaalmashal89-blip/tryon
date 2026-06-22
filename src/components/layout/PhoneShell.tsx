import { ReactNode } from "react";

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    // Mobile: sand bg, centered phone frame
    // Desktop: full-viewport white, no phone chrome
    <div className="fixed inset-0 flex items-center justify-center bg-[#E9E3DF] md:bg-white md:block">
      <div
        className={[
          "relative flex flex-col overflow-hidden bg-white",
          // Mobile phone frame
          "w-[min(440px,100vw)] h-[min(920px,100dvh)]",
          "rounded-[clamp(0px,calc((100vw-441px)*100),30px)]",
          "shadow-[0_40px_90px_-30px_rgba(20,16,22,0.45)]",
          // Desktop: full viewport, no phone styling
          "md:w-full md:h-full md:rounded-none md:shadow-none",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
