"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTryonSession, type SavedTryonSession } from "@/lib/tryonStore";
import { ResultsScreen } from "@/components/screens/Results";

export default function WardrobeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [session, setSession] = useState<SavedTryonSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { router.replace("/wardrobe"); return; }
    getTryonSession(id).then((s) => {
      if (!s) { router.replace("/wardrobe"); return; }
      setSession(s);
      setLoading(false);
    });
  }, [id, router]);

  if (loading || !session) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
          Loading…
        </span>
      </div>
    );
  }

  return (
    <ResultsScreen
      savedResultUrl={session.result_image_url}
      savedReport={session.style_report}
      onBack={() => router.push("/wardrobe")}
    />
  );
}
