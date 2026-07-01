"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { Input } from "@/components/ui/Input";
import { validatePassword, validateConfirmPassword } from "@/lib/validation";

type PageState = "loading" | "ready" | "submitting" | "success" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [errors, setErrors]       = useState({ password: "", confirm: "" });
  const [touched, setTouched]     = useState({ password: false, confirm: false });
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let resolved = false;

    function resolve(next: PageState) {
      if (!resolved) { resolved = true; setPageState(next); }
    }

    // Listen for the recovery event fired by the Supabase client
    // after it exchanges the access_token hash in the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") resolve("ready");
    });

    // If the URL has no recovery-related token, this is either direct
    // navigation or an already-used / expired link — mark invalid immediately.
    const hasCallbackParams =
      window.location.hash.includes("access_token") ||
      new URLSearchParams(window.location.search).has("code");

    if (!hasCallbackParams) {
      resolve("invalid");
    }

    // Safety timeout: if the event never fires (e.g. Supabase rejects the token)
    // treat the link as invalid after 6 s.
    const timer = setTimeout(() => resolve("invalid"), 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit() {
    setTouched({ password: true, confirm: true });
    const pwErr = validatePassword(password);
    const cfErr = validateConfirmPassword(confirm, password);
    setErrors({ password: pwErr, confirm: cfErr });
    if (pwErr || cfErr) return;

    setPageState("submitting");
    setServerError("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setServerError("Couldn't update your password. The link may have expired — request a new one.");
      setPageState("ready");
    } else {
      await supabase.auth.signOut();
      setPageState("success");
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <PhoneShell>
        <div className="flex-1 overflow-y-auto">
          <section className="min-h-full flex flex-col px-[22px] pt-[22px] pb-[calc(24px+env(safe-area-inset-bottom))] box-border animate-fade md:max-w-[560px] md:mx-auto md:w-full md:px-[40px] md:pt-[40px]">
            <h1 className="mt-[40px] mb-[4px] font-[family-name:var(--font-bodoni)] font-medium text-[40px] leading-[0.98] text-[#141016]">
              Password<br />updated
            </h1>
            <span className="mt-[6px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
              You can now sign in
            </span>
            <div className="flex-1" />
            <button
              onClick={() => router.push("/auth?mode=login")}
              className="w-full box-border py-[17px] mt-[12px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
              style={{ background: "var(--lav)" }}
            >
              Sign in
            </button>
          </section>
        </div>
      </PhoneShell>
    );
  }

  // ── Invalid / expired ──────────────────────────────────────────────────────
  if (pageState === "invalid") {
    return (
      <PhoneShell>
        <div className="flex-1 overflow-y-auto">
          <section className="min-h-full flex flex-col px-[22px] pt-[22px] pb-[calc(24px+env(safe-area-inset-bottom))] box-border animate-fade md:max-w-[560px] md:mx-auto md:w-full md:px-[40px] md:pt-[40px]">
            <button
              onClick={() => router.push("/auth")}
              className="self-start w-[34px] h-[34px] rounded-full border border-[rgba(20,16,22,0.12)] bg-white cursor-pointer text-[15px] text-[#141016] flex items-center justify-center"
            >
              ‹
            </button>
            <h1 className="mt-[24px] mb-[4px] font-[family-name:var(--font-bodoni)] font-medium text-[40px] leading-[0.98] text-[#141016]">
              Link expired
            </h1>
            <span className="mt-[6px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
              This reset link is no longer valid
            </span>
            <p className="mt-[24px] font-[family-name:var(--font-grotesk)] text-[15px] leading-[1.55] text-[#6B6470]">
              Reset links expire after a short time and can only be used once.
              Request a new one to continue.
            </p>
            <div className="flex-1" />
            <button
              onClick={() => router.push("/forgot-password")}
              className="w-full box-border py-[17px] mt-[12px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
              style={{ background: "var(--lav)" }}
            >
              Request new link
            </button>
            <button
              onClick={() => router.push("/auth")}
              className="w-full box-border py-[17px] mt-[10px] border border-[rgba(20,16,22,0.14)] rounded-full bg-white font-[family-name:var(--font-grotesk)] font-medium text-[15px] text-[#141016] cursor-pointer"
            >
              Back to login
            </button>
          </section>
        </div>
      </PhoneShell>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <PhoneShell>
        <div className="flex-1 overflow-y-auto flex items-center justify-center">
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
            Verifying…
          </span>
        </div>
      </PhoneShell>
    );
  }

  // ── Ready / Submitting ─────────────────────────────────────────────────────
  return (
    <PhoneShell>
      <div className="flex-1 overflow-y-auto">
        <section className="min-h-full flex flex-col px-[22px] pt-[22px] pb-[calc(24px+env(safe-area-inset-bottom))] box-border animate-fade md:max-w-[560px] md:mx-auto md:w-full md:px-[40px] md:pt-[40px]">
          <button
            onClick={() => router.push("/auth")}
            className="self-start w-[34px] h-[34px] rounded-full border border-[rgba(20,16,22,0.12)] bg-white cursor-pointer text-[15px] text-[#141016] flex items-center justify-center"
          >
            ‹
          </button>

          <h1 className="mt-[24px] mb-[4px] font-[family-name:var(--font-bodoni)] font-medium text-[40px] leading-[0.98] text-[#141016] whitespace-pre-line">
            Set new{"\n"}password
          </h1>
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#9A9298]">
            Choose a strong password
          </span>

          <div className="flex flex-col gap-[14px] mt-[28px]">
            <Input
              label="New password"
              type="password"
              showToggle
              placeholder="Min. 8 characters"
              value={password}
              error={touched.password ? errors.password : undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
              }}
              onBlur={() => {
                setTouched((t) => ({ ...t, password: true }));
                setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
              }}
              autoComplete="new-password"
              dir="ltr"
            />
            <Input
              label="Confirm password"
              type="password"
              showToggle
              placeholder="Repeat password"
              value={confirm}
              error={touched.confirm ? errors.confirm : undefined}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (touched.confirm) setErrors((prev) => ({ ...prev, confirm: validateConfirmPassword(e.target.value, password) }));
              }}
              onBlur={() => {
                setTouched((t) => ({ ...t, confirm: true }));
                setErrors((prev) => ({ ...prev, confirm: validateConfirmPassword(confirm, password) }));
              }}
              autoComplete="new-password"
              dir="ltr"
            />
          </div>

          {serverError && (
            <p className="mt-[16px] font-[family-name:var(--font-grotesk)] text-[13px] text-[#C0392B] leading-[1.5]">
              {serverError}
            </p>
          )}

          <div className="flex-1" />

          <button
            onClick={handleSubmit}
            disabled={pageState === "submitting"}
            className="w-full box-border py-[17px] mt-[12px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "var(--lav)" }}
          >
            {pageState === "submitting" ? "Updating…" : "Update password"}
          </button>
        </section>
      </div>
    </PhoneShell>
  );
}
