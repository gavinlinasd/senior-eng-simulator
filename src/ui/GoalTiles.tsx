import { Gauge, ShieldCheck, Wallet } from 'lucide-react'
import type { Level } from '../sim/types'
import { fmt } from './format'

/** The level's goal at a glance: how much traffic, on what budget, and what counts as holding up. */
export function GoalTiles({ level }: { level: Level }) {
  return (
    <div className="goal">
      <div className="goal__tile">
        <Gauge size={22} aria-hidden />
        <div>
          <div className="goal__value">{fmt(level.targetQps)} QPS</div>
          <div className="goal__label">Target traffic</div>
        </div>
      </div>
      <div className="goal__tile">
        <Wallet size={22} aria-hidden />
        <div>
          <div className="goal__value">${level.budget}</div>
          <div className="goal__label">Budget</div>
        </div>
      </div>
      <div className="goal__tile">
        <ShieldCheck size={22} aria-hidden />
        <div>
          <div className="goal__value">100%</div>
          <div className="goal__label">Stay under, everywhere</div>
        </div>
      </div>
    </div>
  )
}
