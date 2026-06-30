"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTryonSession, type SavedTryonSession } from "@/lib/tryonStore";
import { ResultsScreen } from "@/components/screens/Results";
import type { DualReport } from "@/lib/types";

export default function WardrobeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [session, setSession] = useState<SavedTryonSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTryonSession(id).then((s) => {
      setSession(s);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="min-h-full" />;
  if (!session) return null;

  return (
    <ResultsScreen
      savedResultUrl={session.result_image_url}
      savedReport={session.style_report as DualReport | null}
      onBack={() => router.push("/wardrobe")}
    />
  );
}
