"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthMode, Gender } from "@/lib/types";
import { TabBar } from "@/components/ui/TabBar";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Chip";

export function AuthScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    (params.get("mode") as AuthMode) ?? "register"
  );
  const [gender, setGender] = useState<Gender>(null);

  const isRegister = mode === "register";

  function handleSubmit() {
    if (isRegister) {
      router.push("/profile-setup");
    } else {
      router.push("/home");
    }
  }

  return (
    <section className="min-h-full flex flex-col px-[22px] pt-[22px] pb-[calc(24px+env(safe-area-inset-bottom)] box-border animate-fade">
      <button
        onClick={() => router.push("/landing")}
        className="self-start w-[34px] h-[34px] rounded-full border border-[rgba(20,16,22,0.12)] bg-white cursor-pointer text-[15px] text-[#141016] flex items-center justify-center"
      >
        ‹
      </button>

      <h1 className="mt-[24px] mb-[4px] font-[family-name:var(--font-bodoni)] font-medium text-[40px] leading-[0.98] text-[#141016] whitespace-pre-line">
        {isRegister ? "Create\naccount" : "Welcome\nback"}
      </h1>
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
        {isRegister ? "Join the fitting room" : "Your fitting room awaits"}
      </span>

      <div className="mt-[22px] mb-[6px]">
        <TabBar
          tabs={[
            { label: "Register", value: "register" },
            { label: "Log in",   value: "login"    },
          ]}
          active={mode}
          onChange={(v) => setMode(v as AuthMode)}
        />
      </div>

      <div className="flex flex-col gap-[14px] mt-[16px]">
        {isRegister && (
          <Input label="Full name" placeholder="Mara Vance" />
        )}
        <Input label="Email" type="email" placeholder="you@email.com" />
        <Input label="Password" type="password" placeholder="••••••••" />
        {isRegister && (
          <>
            <Input label="Confirm password" type="password" placeholder="••••••••" />
            <div>
              <label className="block mb-[7px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
                Gender
              </label>
              <div className="flex gap-[10px]">
                {(["male", "female"] as const).map((g) => (
                  <Pill
                    key={g}
                    label={g === "male" ? "Male" : "Female"}
                    active={gender === g}
                    onClick={() => setGender(g)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

      <button
        onClick={handleSubmit}
        className="w-full box-border py-[17px] mt-[24px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
        style={{ background: "var(--lav)" }}
      >
        {isRegister ? "Create account" : "Log in"}
      </button>
    </section>
  );
}
