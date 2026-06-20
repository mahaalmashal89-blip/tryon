import { ReactNode } from "react";

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: "#E9E3DF",
        fontFamily: "var(--font-grotesk), sans-serif",
      }}
    >
      <div
        className="relative flex flex-col overflow-hidden bg-white"
        style={{
          width: "min(440px, 100vw)",
          height: "min(920px, 100dvh)",
          borderRadius: "clamp(0px, calc((100vw - 441px) * 100), 30px)",
          boxShadow: "0 40px 90px -30px rgba(20,16,22,0.45)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
