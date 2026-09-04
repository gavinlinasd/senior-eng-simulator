import { CATALOGUE } from '../sim/catalogue'
import type { BreakingPoint, Level, NodeResult, Score, SimNode } from '../sim/types'
import { fmt, pct } from './format'
import { Lesson } from './Lesson'
import type { Phase } from './RunContext'
import { ScoreTable } from './ScoreTable'
import { Stars } from './Stars'

interface LevelPanelProps {
  level: Level
  spend: number
  errors: string[]
  phase: Phase
  failedNode: SimNode | null
  /** What the failed node was receiving at the breaking point. */
  failedLoad: NodeResult | null
  breaking: BreakingPoint | null
  score: Score | null
  selectionLabel: string | null
  onRemoveSelected: () => void
  onResetLevel: () => void
  onShowIntro: () => void
  hasNext: boolean
  onNext: () => void
  onOpenPicker: () => void
}

export function LevelPanel({
  level,
  spend,
  errors,
  phase,
  failedNode,
  failedLoad,
  breaking,
  score,
  selectionLabel,
  onRemoveSelected,
  onResetLevel,
  onShowIntro,
  hasNext,
  onNext,
  onOpenPicker,
}: LevelPanelProps) {
  const showClasses = (level.traffic?.private ?? 0) > 0 || (level.traffic?.write ?? 0) > 0
  return (
    <aside className="panel">
      <div>
        <div className="brand">Senior Eng Simulator</div>
        <div className="brand__tagline">Learn how to design distributed systems!</div>
      </div>
      <div>
        <div className="panel__eyebrow">Level {level.id}</div>
        <h1 className="panel__title">{level.title}</h1>
        <p className="panel__brief">{level.brief}</p>
      </div>

      <div className="stats">
        <Stat label="Target" value={`${fmt(level.targetQps)} QPS`} />
        <Stat label="Budget" value={`$${spend} / $${level.budget}`} over={spend > level.budget} />
      </div>

      {errors.length > 0 && (
        <div className="notice">
          <div className="notice__title">Before you can send traffic</div>
          {errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}

      {phase === 'failed' && failedNode && breaking && failedLoad && (
        <div className="verdict verdict--over">
          <div className="verdict__title">
            {failedNode.name} hit 100% at {fmt(breaking.qps)} QPS
          </div>
          <div className="verdict__body">
            Receiving {pct(failedLoad.load / breaking.qps)}% of all traffic
            {showClasses && (
              <>
                {' '}
                ({fmt(failedLoad.public)} public, {fmt(failedLoad.private)} private and {fmt(failedLoad.write)} writes
                a second)
              </>
            )}{' '}
            against a capacity of {fmt(CATALOGUE[failedNode.type].capacity)} QPS.
          </div>
        </div>
      )}

      {phase === 'passed' && score && (
        <div className="verdict verdict--ok">
          <div className="verdict__title">Holding steady at {fmt(level.targetQps)} QPS</div>
          <div className="verdict__body">Nothing crossed 100%. This design serves the target load.</div>
          <Stars earned={score.stars} size={18} nextAt={score.nextStarAt} />
          <ScoreTable score={score} />
          {level.lesson && <Lesson lesson={level.lesson} />}
          {hasNext ? (
            <button className="btn btn--ok" onClick={onNext}>
              Next level
            </button>
          ) : (
            <div className="verdict__note">That's the last level for now.</div>
          )}
        </div>
      )}

      {phase === 'idle' && errors.length === 0 && (
        <p className="panel__hint">Send traffic and watch every component as it climbs to {fmt(level.targetQps)} QPS.</p>
      )}

      <div className="panel__actions">
        <button className="btn btn--muted" onClick={onOpenPicker}>
          Jump to level
        </button>
        {selectionLabel && (
          <button className="btn" onClick={onRemoveSelected}>
            Remove {selectionLabel}
          </button>
        )}
        <button className="btn btn--muted" onClick={onResetLevel}>
          Reset level
        </button>
        <button className="btn btn--muted" onClick={onShowIntro}>
          Replay intro
        </button>
      </div>
    </aside>
  )
}

function Stat({ label, value, over }: { label: string; value: string; over?: boolean }) {
  return (
    <div className={over ? 'stat stat--over' : 'stat'}>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
    </div>
  )
}
