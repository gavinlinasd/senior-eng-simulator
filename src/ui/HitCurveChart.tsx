import { hitRate } from '../sim/engine'
import type { HitCurve } from '../sim/types'

const W = 220
const H = 64
const PAD = { left: 26, right: 8, top: 8, bottom: 16 }
const MAX_X = 2000

/** Tiny sparkline of a cache's hit rate against lookups per second, with the two anchor points marked. */
export function HitCurveChart({ curve }: { curve: HitCurve }) {
  const x = (lookups: number) => PAD.left + (lookups / MAX_X) * (W - PAD.left - PAD.right)
  const y = (rate: number) => PAD.top + (1 - rate) * (H - PAD.top - PAD.bottom)
  const points: string[] = []
  for (let l = 0; l <= MAX_X; l += 20) points.push(`${x(l).toFixed(1)},${y(hitRate(curve, l)).toFixed(1)}`)
  const anchors = [curve.baseLoad, curve.baseLoad * 2].map((l) => ({ l, r: hitRate(curve, l) }))
  const short = (n: number) => (n >= 1000 ? `${n / 1000}k` : String(n))

  return (
    <svg className="hit-curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Hit rate rises with lookups on a log curve">
      <line className="hit-curve__axis" x1={PAD.left} y1={y(0)} x2={W - PAD.right} y2={y(0)} />
      <line className="hit-curve__axis" x1={PAD.left} y1={y(1)} x2={PAD.left} y2={y(0)} />
      <text className="hit-curve__label" x={PAD.left - 4} y={y(1) + 3} textAnchor="end">
        100%
      </text>
      <text className="hit-curve__label" x={PAD.left - 4} y={y(0) + 3} textAnchor="end">
        0
      </text>
      <text className="hit-curve__label" x={W - PAD.right} y={H - 4} textAnchor="end">
        {short(MAX_X)} lookups/s
      </text>
      <polyline className="hit-curve__line" points={points.join(' ')} />
      {anchors.map(({ l, r }, i) => (
        <g key={l}>
          <circle className="hit-curve__dot" cx={x(l)} cy={y(r)} r={3} />
          {/* staggered so neighbouring labels don't collide */}
          <text className="hit-curve__label" x={x(l) + 5 + i * 6} y={y(r) + 11 + i * 15}>
            {short(l)} → {Math.round(r * 100)}%
          </text>
        </g>
      ))}
    </svg>
  )
}
