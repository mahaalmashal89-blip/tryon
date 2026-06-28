interface ScoreCircleProps {
  score: number | null;
  loading?: boolean;
  size?: "sm" | "lg";
}

export function ScoreCircle({ score, loading = false, size = "lg" }: ScoreCircleProps) {
  if (size === "sm") {
    return (
      <div className="text-right flex-none">
        {loading ? (
          <div className="w-[36px] h-[26px] rounded-[6px] bg-[#E8E4E0] animate-pulse" />
        ) : (
          <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[26px] leading-none text-[#141016]">
            {score ?? "—"}
          </div>
        )}
        <div className="font-[family-name:var(--font-mono)] text-[9px] text-[#9A9298]">
          /100
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute bottom-[14px] right-[14px] w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center"
      style={{
        background: loading ? "#E8E4E0" : "var(--lime)",
        boxShadow: "0 8px 20px -6px rgba(20,16,22,0.3)",
        animation: loading ? "pulse 1.5s ease-in-out infinite" : "none",
      }}
    >
      {!loading && (
        <>
          <span className="font-[family-name:var(--font-bodoni)] font-semibold text-[26px] leading-none text-[#141016]">
            {score ?? "—"}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[8px] tracking-[0.1em] text-[#3A343C]">
            /100
          </span>
        </>
      )}
    </div>
  );
}
