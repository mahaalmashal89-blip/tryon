"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function useAnalyzeTimer() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ivRef.current = setInterval(() => {
      setStep((s) => Math.min(s + 1, 3));
    }, 680);

    toRef.current = setTimeout(() => {
      if (ivRef.current) clearInterval(ivRef.current);
      router.push("/tryon/results");
    }, 2950);

    return () => {
      if (ivRef.current) clearInterval(ivRef.current);
      if (toRef.current) clearTimeout(toRef.current);
    };
  }, [router]);

  return step;
}
