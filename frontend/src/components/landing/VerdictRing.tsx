type VerdictRingProps = {
  met: number
  total: number
  size?: number
}

/** Static SVG progress ring, e.g. "7/9 conditions met". No chart library. */
export function VerdictRing({ met, total, size = 96 }: VerdictRingProps) {
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const center = size / 2

  return (
    <div
      role="img"
      aria-label={`${met} of ${total} conditions met`}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - met / total)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute font-mono text-lg font-semibold"
      >
        {met}/{total}
      </span>
    </div>
  )
}
