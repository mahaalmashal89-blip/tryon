"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface ChromeProps {
  showBack?: boolean;
  onMenuToggle: () => void;
}

export function Chrome({ showBack = false, onMenuToggle }: ChromeProps) {
  const router = useRouter();

  return (
    <div
      className="flex-none h-[58px] flex items-center justify-between px-[18px] z-[5] bg-white"
      style={{ borderBottom: "1px solid var(--lime)" }}
    >
      <div className="flex items-center gap-[10px]">
        {showBack && (
          <button
            onClick={() => router.push("/home")}
            className="w-[34px] h-[34px] rounded-full bg-white border border-[rgba(20,16,22,0.12)] flex items-center justify-center cursor-pointer text-[15px] text-[#141016]"
          >
            ‹
          </button>
        )}
        <Link
          href="/home"
          className="no-underline font-[family-name:var(--font-grotesk)] font-bold text-[17px] tracking-[0.04em] text-[#141016]"
        >
          TRY<span>ON</span>
        </Link>
      </div>

      <button
        onClick={onMenuToggle}
        className="w-[38px] h-[38px] rounded-full bg-white border border-[rgba(20,16,22,0.12)] flex flex-col items-center justify-center gap-[4px] cursor-pointer"
      >
        <span className="block w-[15px] h-[1.5px] bg-[#141016]" />
        <span className="block w-[15px] h-[1.5px] bg-[#141016]" />
      </button>
    </div>
  );
}
