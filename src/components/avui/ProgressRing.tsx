/** Cercle de progrés accessible (SVG). `ratio` 0..1. */
export function ProgressRing({ ratio, caption, size = 128 }: { ratio: number; caption: string; size?: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${pct} %, ${caption}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={pct >= 100 ? "var(--done)" : "var(--primary)"} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--text)" className="num font-serif" fontSize={size * 0.24} fontWeight={600}>
        {pct}%
      </text>
    </svg>
  );
}
