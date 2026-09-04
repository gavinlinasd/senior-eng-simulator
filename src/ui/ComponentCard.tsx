import { CATALOGUE } from '../sim/catalogue'
import type { NodeType } from '../sim/types'
import { fmt } from './format'
import { HitCurveChart } from './HitCurveChart'
import { ICONS } from './icons'
import { RichText } from './RichText'

/** The face of a component: icon, name, max QPS and price, blurb, and the hit-rate curve for a cache. */
export function ComponentCard({ type, isNew }: { type: NodeType; isNew?: boolean }) {
  const spec = CATALOGUE[type]
  const Icon = ICONS[type]
  return (
    <>
      {isNew && <span className="tray__badge">New</span>}
      <div className="tray__icon">
        <Icon size={24} aria-hidden />
      </div>
      <div>
        <div className="tray__label">{spec.label}</div>
        <div className="tray__meta">
          Max {fmt(spec.capacity)} QPS · ${spec.cost}
        </div>
        <div className="tray__blurb">
          <RichText text={spec.blurb} />
        </div>
        {spec.hitCurve && <HitCurveChart curve={spec.hitCurve} />}
      </div>
    </>
  )
}
