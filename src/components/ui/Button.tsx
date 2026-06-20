"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "lav" | "ghost" | "outline" | "icon";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center cursor-pointer transition-all duration-150 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary:
      "w-full py-[17px] rounded-full border-none bg-[#141016] text-white font-[family-name:var(--font-grotesk)] font-semibold text-[15px]",
    lav:
      "w-full py-[17px] rounded-full border-none bg-[var(--lav)] text-[#141016] font-[family-name:var(--font-grotesk)] font-semibold text-[15px]",
    ghost:
      "w-full py-[15px] border border-[rgba(20,16,22,0.14)] rounded-full bg-white text-[#141016] font-[family-name:var(--font-grotesk)] font-medium text-[14px]",
    outline:
      "py-[14px] px-0 border-none bg-transparent text-[#9A9298] font-[family-name:var(--font-mono)] text-[12px] tracking-[0.1em] uppercase",
    icon:
      "w-[34px] h-[34px] rounded-full border border-[rgba(20,16,22,0.12)] bg-white text-[#141016] text-[15px]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
