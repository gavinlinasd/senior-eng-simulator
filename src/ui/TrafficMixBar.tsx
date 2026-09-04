import type { ClassLoad } from '../sim/types'
import { classLabel, classesIn } from './classes'
import { pct } from './format'

/** One stacked bar of the traffic mix, each segment labelled with its share. */
export function TrafficMixBar({ traffic }: { traffic: ClassLoad }) {
  const parts = classesIn(traffic)
  const label = (c: (typeof parts)[number]) => classLabel(c, parts).toLowerCase()
  return (
    <div className="mix" role="img" aria-label={parts.map((c) => `${pct(traffic[c])}% ${label(c)}`).join(', ')}>
      <div className="mix__bar">
        {parts.map((c) => (
          <div key={c} className={`mix__seg mix__seg--${c}`} style={{ flexGrow: traffic[c] }} />
        ))}
      </div>
      <div className="mix__legend">
        {parts.map((c) => (
          <span key={c} className="mix__item">
            <span className={`mix__dot mix__seg--${c}`} />
            {pct(traffic[c])}% {label(c)}
          </span>
        ))}
      </div>
    </div>
  )
}
