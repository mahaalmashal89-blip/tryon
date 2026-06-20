"use client";

import { InputHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
  error?: string;
  showToggle?: boolean; // enables eye icon for password fields
}

export function Input({ label, unit, error, showToggle, className = "", type, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  const borderClass = error
    ? "border-red-400 focus:border-red-500"
    : "border-[rgba(20,16,22,0.12)] focus:border-[#141016]";

  const resolvedType = showToggle
    ? (visible ? "text" : "password")
    : type;

  const hasRightAddon = unit || showToggle;

  return (
    <div>
      {label && (
        <label className="block mb-[7px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={resolvedType}
          className={`w-full box-border py-[15px] px-[16px] border rounded-[14px] bg-white font-[family-name:var(--font-grotesk)] text-[15px] text-[#141016] outline-none transition-colors ${borderClass} ${hasRightAddon ? "pr-[44px]" : ""} ${className}`}
          {...props}
        />

        {/* Unit label (cm, kg, etc.) */}
        {unit && !showToggle && (
          <span className="absolute right-[13px] top-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[11px] text-[#B6ADA8]">
            {unit}
          </span>
        )}

        {/* Eye toggle for password fields */}
        {showToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-[13px] top-1/2 -translate-y-1/2 flex items-center justify-center w-[22px] h-[22px] text-[#9A9298] hover:text-[#141016] transition-colors bg-transparent border-none cursor-pointer p-0"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-[5px] font-[family-name:var(--font-grotesk)] text-[12px] text-red-500 leading-snug">
          {error}
        </p>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12C1 12 5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
