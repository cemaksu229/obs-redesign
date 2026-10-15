export default function Ring({ value, max, size = 104, stroke = 10, color = 'var(--navy)', label, sub }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max ? Math.min(1, value / max) : 0
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${label || ''} ${value} / ${max}`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
        />
      </svg>
      <div className="ring-label">
        <div className="ring-value">{label ?? `${Math.round(pct * 100)}%`}</div>
        {sub && <div className="small muted">{sub}</div>}
      </div>
    </div>
  )
}
