"use client";

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="px-[16px] py-[10px] rounded-full font-[family-name:var(--font-grotesk)] font-medium text-[13px] text-[#141016] cursor-pointer transition-all duration-150"
      style={{
        border: `1px solid ${active ? "var(--lav)" : "var(--lime)"}`,
        background: active ? "var(--lav)" : "#fff",
      }}
    >
      {label}
    </button>
  );
}

interface PillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function Pill({ label, active, onClick }: PillProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-[14px] rounded-[14px] font-[family-name:var(--font-grotesk)] font-semibold text-[14px] text-[#141016] cursor-pointer transition-all duration-150"
      style={{
        border: `1px solid ${active ? "var(--lav)" : "rgba(20,16,22,0.12)"}`,
        background: active ? "var(--lav)" : "#fff",
      }}
    >
      {label}
    </button>
  );
}
