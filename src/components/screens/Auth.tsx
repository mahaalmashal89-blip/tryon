"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthMode, Gender } from "@/lib/types";
import { TabBar } from "@/components/ui/TabBar";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Chip";
import {
  validateEmail,
  validatePassword,
  validateLoginPassword,
  validateConfirmPassword,
  validateName,
} from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";

interface AuthErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  gender?: string;
}

export function AuthScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    (params.get("mode") as AuthMode) ?? "register"
  );
  const [gender, setGender] = useState<Gender>(null);

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [errors, setErrors]     = useState<AuthErrors>({});
  const [touched, setTouched]   = useState<Record<string, boolean>>({});
  const [loading, setLoading]   = useState(false);
  const [authError, setAuthError] = useState("");

  const isRegister = mode === "register";

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function validate(): AuthErrors {
    const e: AuthErrors = {};
    if (isRegister) {
      const nameErr = validateName(name);
      if (nameErr) e.name = nameErr;
    }
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    const pwErr = isRegister ? validatePassword(password) : validateLoginPassword(password);
    if (pwErr) e.password = pwErr;
    if (isRegister) {
      const cfErr = validateConfirmPassword(confirm, password);
      if (cfErr) e.confirm = cfErr;
      if (!gender) e.gender = "Please select your gender.";
    }
    return e;
  }

  async function handleSubmit() {
    // Mark all fields as touched so errors show
    const allTouched: Record<string, boolean> = {
      email: true, password: true,
    };
    if (isRegister) {
      allTouched.name = true;
      allTouched.confirm = true;
      allTouched.gender = true;
    }
    setTouched(allTouched);

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    setAuthError("");

    const supabase = createClient();

    if (isRegister) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, gender },
          emailRedirectTo: `${origin}/auth`,
        },
      });
      if (error) { setAuthError("Unable to create account. Please check your details and try again."); setLoading(false); return; }
      router.push("/profile-setup");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setAuthError("Invalid email or password."); setLoading(false); return; }
      // Full navigation so the server-side proxy reads the fresh session cookie.
      window.location.href = "/home";
    }
  }

  // Re-validate on change once a field has been touched
  function handleChange(
    field: keyof AuthErrors,
    value: string,
    setter: (v: string) => void
  ) {
    setter(value);
    if (!touched[field]) return;
    const current = { name, email, password, confirm, [field]: value };
    const e: AuthErrors = { ...errors };
    if (field === "name")     e.name    = validateName(current.name);
    if (field === "email")    e.email   = validateEmail(current.email);
    if (field === "password") e.password = validatePassword(current.password);
    if (field === "confirm")  e.confirm  = validateConfirmPassword(current.confirm, current.password);
    if (!e.name)    delete e.name;
    if (!e.email)   delete e.email;
    if (!e.password) delete e.password;
    if (!e.confirm) delete e.confirm;
    setErrors(e);
  }

  return (
    <section className="min-h-full flex flex-col px-[22px] pt-[22px] pb-[calc(24px+env(safe-area-inset-bottom))] box-border animate-fade md:max-w-[560px] md:mx-auto md:w-full md:px-[40px] md:pt-[40px]">
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
          onChange={(v) => {
            setMode(v as AuthMode);
            setErrors({});
            setTouched({});
          }}
        />
      </div>

      <div className="flex flex-col gap-[14px] mt-[16px]">
        {isRegister && (
          <Input
            label="Full name"
            placeholder="Maha Alm"
            value={name}
            error={touched.name ? errors.name : undefined}
            onChange={(e) => handleChange("name", e.target.value, setName)}
            onBlur={() => touch("name")}
            autoComplete="name"
          />
        )}
        <Input
          label="Email"
          type="email"
          placeholder="you@email.com"
          value={email}
          error={touched.email ? errors.email : undefined}
          onChange={(e) => handleChange("email", e.target.value, setEmail)}
          onBlur={() => touch("email")}
          autoComplete="email"
          inputMode="email"
          dir="ltr"
        />
        <div>
          <Input
            label="Password"
            showToggle
            placeholder="••••••••"
            value={password}
            error={touched.password ? errors.password : undefined}
            onChange={(e) => handleChange("password", e.target.value, setPassword)}
            onBlur={() => touch("password")}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
          {!isRegister && (
            <div className="flex justify-end mt-[6px]">
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="font-[family-name:var(--font-grotesk)] text-[12px] text-[#9A9298] hover:text-[#141016] transition-colors bg-transparent border-none cursor-pointer p-0 underline underline-offset-2"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>
        {isRegister && (
          <>
            <Input
              label="Confirm password"
              showToggle
              placeholder="••••••••"
              value={confirm}
              error={touched.confirm ? errors.confirm : undefined}
              onChange={(e) => handleChange("confirm", e.target.value, setConfirm)}
              onBlur={() => touch("confirm")}
              autoComplete="new-password"
            />
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
                    onClick={() => {
                      setGender(g);
                      setErrors((e) => { const n = { ...e }; delete n.gender; return n; });
                    }}
                  />
                ))}
              </div>
              {touched.gender && errors.gender && (
                <p className="mt-[5px] font-[family-name:var(--font-grotesk)] text-[12px] text-red-500">
                  {errors.gender}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

      {authError && (
        <p className="mt-[12px] font-[family-name:var(--font-grotesk)] text-[13px] text-red-500 text-center leading-snug">
          {authError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full box-border py-[17px] mt-[12px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "var(--lav)" }}
      >
        {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
      </button>
    </section>
  );
}
