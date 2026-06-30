import { ReactNode } from "react";

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    // Mobile: sand bg, centered — inner fills full viewport (no grey gutters)
    // Desktop (md+): white bg, block — full viewport, no phone chrome (approved)
    <div className="fixed inset-0 flex items-center justify-center bg-[#E9E3DF] md:bg-white md:block">
      <div
        className={[
          "relative flex flex-col overflow-hidden bg-white",
          // Mobile: fill full viewport — no 440px cap, no grey gutters
          "w-full h-full",
          // Desktop: original approved — full viewport, no phone chrome
          "md:w-full md:h-full md:rounded-none md:shadow-none",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
