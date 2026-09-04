import type { ClassLoad } from '../sim/types'
import { pct } from './format'

const SEGMENTS: Array<{ key: keyof ClassLoad; label: string }> = [
  { key: 'public', label: 'public pages' },
  { key: 'private', label: 'private reads' },
  { key: 'write', label: 'writes' },
]

/** One stacked bar of the traffic mix, each segment labelled with its share. */
export function TrafficMixBar({ traffic }: { traffic: ClassLoad }) {
  const parts = SEGMENTS.filter((s) => traffic[s.key] > 0)
  return (
    <div className="mix" role="img" aria-label={parts.map((s) => `${pct(traffic[s.key])}% ${s.label}`).join(', ')}>
      <div className="mix__bar">
        {parts.map((s) => (
          <div key={s.key} className={`mix__seg mix__seg--${s.key}`} style={{ flexGrow: traffic[s.key] }} />
        ))}
      </div>
      <div className="mix__legend">
        {parts.map((s) => (
          <span key={s.key} className="mix__item">
            <span className={`mix__dot mix__seg--${s.key}`} />
            {pct(traffic[s.key])}% {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
