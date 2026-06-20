"use client";

interface Tab {
  label: string;
  value: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
  bordered?: boolean;
}

export function TabBar({ tabs, active, onChange, bordered = false }: TabBarProps) {
  return (
    <div
      className={`flex gap-1 bg-[#F2EEEC] p-1 rounded-full ${bordered ? "border border-[var(--lime)]" : ""}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className="flex-1 py-[11px] px-[14px] rounded-full border-none transition-all duration-150 font-[family-name:var(--font-grotesk)] font-semibold text-[13.5px] cursor-pointer"
            style={{
              background: isActive ? "#fff" : "transparent",
              color: isActive ? "#141016" : "#9A9298",
              boxShadow: isActive ? "0 2px 8px -2px rgba(20,16,22,0.18)" : "none",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

interface MiniTabProps {
  labels: string[];
  active: string;
  onChange: (value: string) => void;
}

export function MiniTab({ labels, active, onChange }: MiniTabProps) {
  return (
    <div className="flex gap-1 bg-[#F2EEEC] p-[3px] rounded-full">
      {labels.map((label) => {
        const isActive = label === active;
        return (
          <button
            key={label}
            onClick={() => onChange(label)}
            className="w-[30px] py-[6px] rounded-full border-none cursor-pointer font-[family-name:var(--font-mono)] text-[12px] transition-all duration-150"
            style={{
              background: isActive ? "#141016" : "transparent",
              color: isActive ? "#fff" : "#9A9298",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
