"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { validateEmail } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit() {
    setTouched(true);
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }

    setLoading(true);
    setError("");
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    // Always show success to prevent email enumeration.
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <section className="min-h-full flex flex-col px-[22px] pt-[22px] pb-[calc(24px+env(safe-area-inset-bottom))] box-border animate-fade md:max-w-[560px] md:mx-auto md:w-full md:px-[40px] md:pt-[40px]">
        <button
          onClick={() => router.push("/auth")}
          className="self-start w-[34px] h-[34px] rounded-full border border-[rgba(20,16,22,0.12)] bg-white cursor-pointer text-[15px] text-[#141016] flex items-center justify-center"
        >
          ‹
        </button>
        <h1 className="mt-[24px] mb-[4px] font-[family-name:var(--font-bodoni)] font-medium text-[40px] leading-[0.98] text-[#141016]">
          Check your<br />inbox
        </h1>
        <span className="mt-[6px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
          Reset link sent
        </span>
        <p className="mt-[24px] font-[family-name:var(--font-grotesk)] text-[15px] leading-[1.55] text-[#6B6470]">
          If an account exists for <span className="text-[#141016] font-medium">{email}</span>, you'll receive a password reset link shortly.
        </p>
        <div className="flex-1" />
        <button
          onClick={() => router.push("/auth")}
          className="w-full box-border py-[17px] mt-[12px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
          style={{ background: "var(--lav)" }}
        >
          Back to login
        </button>
      </section>
    );
  }

  return (
    <section className="min-h-full flex flex-col px-[22px] pt-[22px] pb-[calc(24px+env(safe-area-inset-bottom))] box-border animate-fade md:max-w-[560px] md:mx-auto md:w-full md:px-[40px] md:pt-[40px]">
      <button
        onClick={() => router.push("/auth")}
        className="self-start w-[34px] h-[34px] rounded-full border border-[rgba(20,16,22,0.12)] bg-white cursor-pointer text-[15px] text-[#141016] flex items-center justify-center"
      >
        ‹
      </button>

      <h1 className="mt-[24px] mb-[4px] font-[family-name:var(--font-bodoni)] font-medium text-[40px] leading-[0.98] text-[#141016] whitespace-pre-line">
        Reset your{"\n"}password
      </h1>
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
        We'll send a link to your email
      </span>

      <div className="mt-[28px]">
        <Input
          label="Email"
          type="email"
          placeholder="you@email.com"
          value={email}
          error={touched ? error : undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) setError(validateEmail(e.target.value));
          }}
          onBlur={() => { setTouched(true); setError(validateEmail(email)); }}
          autoComplete="email"
          inputMode="email"
          dir="ltr"
        />
      </div>

      <div className="flex-1" />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full box-border py-[17px] mt-[12px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "var(--lav)" }}
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </section>
  );
}
