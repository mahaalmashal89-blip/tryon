export function HowTryonWorksBanner() {
  return (
    <svg
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Background */}
      <rect width="760" height="280" fill="#EDE5F2" />

      {/* Subtle gradient overlay */}
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F2EAF7" />
          <stop offset="100%" stopColor="#E3D5ED" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#F7F2FB" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="dressGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9CAF88" />
          <stop offset="100%" stopColor="#7A9068" />
        </linearGradient>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5EEF9" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#EDE3F5" stopOpacity="0.9" />
        </linearGradient>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#B89FC8" floodOpacity="0.18" />
        </filter>
        <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#9B7BB8" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect width="760" height="280" fill="url(#bgGrad)" />

      {/* Decorative blobs */}
      <ellipse cx="80" cy="60" rx="90" ry="70" fill="#D9C8E8" fillOpacity="0.35" />
      <ellipse cx="680" cy="220" rx="100" ry="80" fill="#C8B8DC" fillOpacity="0.28" />
      <ellipse cx="380" cy="280" rx="160" ry="60" fill="#D4C2E4" fillOpacity="0.2" />

      {/* ── TOP LABEL ── */}
      <text
        x="380" y="28"
        textAnchor="middle"
        fontFamily="monospace"
        fontSize="9"
        letterSpacing="2.5"
        fill="#9A85A8"
        fontWeight="500"
      >
        [ HOW TRYON WORKS ]
      </text>

      {/* ── CONNECTOR LINE ── */}
      <line x1="148" y1="118" x2="612" y2="118" stroke="#C8B8DC" strokeWidth="1" strokeDasharray="4 4" />

      {/* ══════════════════════════════════════
          STEP 01 — PHOTO
      ══════════════════════════════════════ */}
      <g filter="url(#softShadow)">
        <rect x="30" y="44" width="118" height="158" rx="14" fill="url(#cardGrad)" />
      </g>

      {/* Person silhouette — white tee + jeans */}
      {/* Body */}
      <ellipse cx="89" cy="78" rx="16" ry="16" fill="#F5D5C0" /> {/* head */}
      {/* hair */}
      <path d="M73 72 Q89 58 105 72 Q105 60 89 56 Q73 60 73 72Z" fill="#3D2B1F" />
      {/* neck */}
      <rect x="86" y="93" width="6" height="8" rx="3" fill="#F0C8A8" />
      {/* white tee */}
      <path d="M68 100 Q89 96 110 100 L114 158 Q89 162 64 158Z" fill="#FFFFFF" />
      {/* collar */}
      <path d="M83 100 Q89 104 95 100" stroke="#E0E0E0" strokeWidth="1" fill="none" />
      {/* sleeves */}
      <path d="M68 100 L56 122 Q60 125 64 122 L68 104Z" fill="#FFFFFF" />
      <path d="M110 100 L122 122 Q118 125 114 122 L110 104Z" fill="#FFFFFF" />
      {/* jeans */}
      <path d="M64 158 L60 202 L78 202 L89 178 L100 202 L118 202 L114 158Z" fill="#4A6FA5" />
      {/* jeans highlight */}
      <path d="M68 162 L66 190" stroke="#5A80B8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M110 162 L112 190" stroke="#5A80B8" strokeWidth="1.5" strokeLinecap="round" />

      {/* Step label */}
      <rect x="42" y="46" width="36" height="14" rx="7" fill="#141016" />
      <text x="60" y="56.5" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fill="#C8EA75" letterSpacing="0.5">01</text>
      <text x="89" y="218" textAnchor="middle" fontFamily="monospace" fontSize="8.5" fill="#7A6882" letterSpacing="1.5">PHOTO</text>

      {/* Upload icon */}
      <circle cx="89" cy="230" r="10" fill="#DCC0DF" fillOpacity="0.6" />
      <path d="M89 235 L89 226 M86 229 L89 226 L92 229" stroke="#6B4F7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* ══════════════════════════════════════
          STEP 02 — OUTFIT (sage green dress)
      ══════════════════════════════════════ */}
      <g filter="url(#softShadow)">
        <rect x="321" y="44" width="118" height="158" rx="14" fill="url(#cardGrad)" />
      </g>

      {/* Dress — one-shoulder sage green */}
      {/* Hanger bar */}
      <line x1="380" y1="56" x2="380" y2="63" stroke="#C0A8C8" strokeWidth="1.5" />
      <path d="M362 63 Q380 58 398 63" stroke="#C0A8C8" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Dress body */}
      <path
        d="M355 72 Q365 68 380 70 Q395 68 400 76
           L408 130 Q408 138 400 142
           L390 200 Q380 204 370 200
           L360 142 Q352 138 352 130 Z"
        fill="url(#dressGrad)"
      />
      {/* One-shoulder strap */}
      <path d="M380 70 Q390 65 400 68 L400 76 Q390 73 380 70Z" fill="#8FA87A" />
      {/* Waist drape */}
      <path d="M355 108 Q380 116 408 108" stroke="#7A9068" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M357 112 Q380 120 406 112" stroke="#8FA87A" strokeWidth="1" fill="none" opacity="0.4" />
      {/* Fabric texture lines */}
      <path d="M365 85 Q380 88 395 85" stroke="#AABF96" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M363 95 Q380 98 397 95" stroke="#AABF96" strokeWidth="0.8" fill="none" opacity="0.5" />
      {/* Hem detail */}
      <path d="M362 195 Q380 200 398 195" stroke="#8FA87A" strokeWidth="1" fill="none" opacity="0.6" />

      {/* Step label */}
      <rect x="333" y="46" width="36" height="14" rx="7" fill="#141016" />
      <text x="351" y="56.5" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fill="#C8EA75" letterSpacing="0.5">02</text>
      <text x="380" y="218" textAnchor="middle" fontFamily="monospace" fontSize="8.5" fill="#7A6882" letterSpacing="1.5">OUTFIT</text>

      {/* Hanger icon */}
      <circle cx="380" cy="230" r="10" fill="#DCC0DF" fillOpacity="0.6" />
      <path d="M380 224 L380 227 Q374 231 374 234 Q374 236 380 236 Q386 236 386 234 Q386 231 380 227" stroke="#6B4F7A" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* ══════════════════════════════════════
          STEP 03 — RESULT
      ══════════════════════════════════════ */}
      <g filter="url(#softShadow)">
        <rect x="500" y="44" width="118" height="158" rx="14" fill="url(#cardGrad)" />
      </g>

      {/* Person in sage dress (result) */}
      <ellipse cx="559" cy="80" rx="15" ry="15" fill="#F5D5C0" /> {/* head */}
      <path d="M544 74 Q559 62 574 74 Q574 62 559 58 Q544 62 544 74Z" fill="#3D2B1F" />
      {/* neck */}
      <rect x="556" y="94" width="6" height="7" rx="3" fill="#F0C8A8" />
      {/* sage dress on model */}
      <path
        d="M538 100 Q549 96 559 98 Q569 96 575 102
           L582 148 Q582 155 576 158
           L568 200 Q559 204 550 200
           L542 158 Q536 155 536 148 Z"
        fill="url(#dressGrad)"
      />
      {/* one-shoulder strap */}
      <path d="M559 98 Q567 93 575 96 L575 102 Q567 99 559 98Z" fill="#8FA87A" />
      {/* Waist drape */}
      <path d="M538 128 Q559 135 582 128" stroke="#7A9068" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Elegant pose arm */}
      <path d="M536 148 L524 168 Q526 172 530 170 L538 150Z" fill="url(#dressGrad)" />

      {/* ✦ AI sparkle */}
      <text x="590" y="60" fontFamily="serif" fontSize="11" fill="#C8EA75" opacity="0.8">✦</text>
      <text x="582" y="72" fontFamily="serif" fontSize="7" fill="#C8EA75" opacity="0.5">✦</text>

      {/* Step label */}
      <rect x="512" y="46" width="36" height="14" rx="7" fill="#141016" />
      <text x="530" y="56.5" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fill="#C8EA75" letterSpacing="0.5">03</text>
      <text x="559" y="218" textAnchor="middle" fontFamily="monospace" fontSize="8.5" fill="#7A6882" letterSpacing="1.5">RESULT</text>

      {/* Sparkles icon */}
      <circle cx="559" cy="230" r="10" fill="#DCC0DF" fillOpacity="0.6" />
      <path d="M559 222 L560.2 226.8 L565 228 L560.2 229.2 L559 234 L557.8 229.2 L553 228 L557.8 226.8Z" fill="#6B4F7A" />

      {/* ══════════════════════════════════════
          SCORE CARDS (right of result)
      ══════════════════════════════════════ */}
      {/* FIT */}
      <g filter="url(#cardShadow)">
        <rect x="630" y="52" width="56" height="36" rx="10" fill="url(#scoreGrad)" />
      </g>
      <text x="658" y="67" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#9A85A8" letterSpacing="1">FIT</text>
      <text x="658" y="80" textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fill="#141016" fontWeight="600">9/10</text>

      {/* COLOR */}
      <g filter="url(#cardShadow)">
        <rect x="630" y="96" width="56" height="36" rx="10" fill="url(#scoreGrad)" />
      </g>
      <text x="658" y="111" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#9A85A8" letterSpacing="1">COLOR</text>
      <text x="658" y="124" textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fill="#141016" fontWeight="600">8.5/10</text>

      {/* STYLE */}
      <g filter="url(#cardShadow)">
        <rect x="630" y="140" width="56" height="36" rx="10" fill="url(#scoreGrad)" />
      </g>
      <text x="658" y="155" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#9A85A8" letterSpacing="1">STYLE</text>
      <text x="658" y="168" textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fill="#141016" fontWeight="600">9/10</text>

      {/* ══════════════════════════════════════
          BOTTOM FEATURE HIGHLIGHTS
      ══════════════════════════════════════ */}
      <line x1="30" y1="216" x2="720" y2="216" stroke="#C8B8DC" strokeWidth="0.5" opacity="0.5" />

      {/* AI-Powered */}
      <circle cx="127" cy="242" r="13" fill="#DCC0DF" fillOpacity="0.5" />
      <text x="127" y="246" textAnchor="middle" fontFamily="serif" fontSize="12" fill="#6B4F7A">✦</text>
      <text x="163" y="237" fontFamily="system-ui, sans-serif" fontSize="9" fill="#141016" fontWeight="600">AI-Powered</text>
      <text x="163" y="249" fontFamily="system-ui, sans-serif" fontSize="8" fill="#9A85A8">Smart fitting &amp; analysis</text>

      {/* Color Analysis */}
      <circle cx="310" cy="242" r="13" fill="#DCC0DF" fillOpacity="0.5" />
      <rect x="303" y="237" width="5" height="5" rx="1" fill="#E88" />
      <rect x="309" y="237" width="5" height="5" rx="1" fill="#8C8" />
      <rect x="303" y="243" width="5" height="5" rx="1" fill="#88E" />
      <rect x="309" y="243" width="5" height="5" rx="1" fill="#EC8" />
      <text x="346" y="237" fontFamily="system-ui, sans-serif" fontSize="9" fill="#141016" fontWeight="600">Color Analysis</text>
      <text x="346" y="249" fontFamily="system-ui, sans-serif" fontSize="8" fill="#9A85A8">Find your perfect shades</text>

      {/* Style Guidance */}
      <circle cx="535" cy="242" r="13" fill="#DCC0DF" fillOpacity="0.5" />
      <path d="M528 242 L535 237 L542 242 L535 247Z" fill="#6B4F7A" fillOpacity="0.7" />
      <text x="558" y="237" fontFamily="system-ui, sans-serif" fontSize="9" fill="#141016" fontWeight="600">Style Guidance</text>
      <text x="558" y="249" fontFamily="system-ui, sans-serif" fontSize="8" fill="#9A85A8">Personalized recommendations</text>
    </svg>
  );
}
