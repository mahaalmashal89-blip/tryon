"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
}

export function Input({ label, unit, className = "", ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block mb-[7px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`w-full box-border py-[15px] px-[16px] border border-[rgba(20,16,22,0.12)] rounded-[14px] bg-white font-[family-name:var(--font-grotesk)] text-[15px] text-[#141016] outline-none ${unit ? "pr-[42px]" : ""} ${className}`}
          {...props}
        />
        {unit && (
          <span className="absolute right-[13px] top-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[11px] text-[#B6ADA8]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
