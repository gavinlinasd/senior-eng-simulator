import { PartyPopper } from 'lucide-react'
import type { Level, Score } from '../sim/types'
import { fmt } from './format'
import { Lesson } from './Lesson'
import { Modal } from './Modal'
import { ScoreTable } from './ScoreTable'
import { Stars } from './Stars'

interface SuccessModalProps {
  open: boolean
  level: Level
  score: Score | null
  hasNext: boolean
  onNext: () => void
  onClose: () => void
}

export function SuccessModal({ open, level, score, hasNext, onNext, onClose }: SuccessModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="modal celebrate" labelledBy="celebrate-title">
      <div className="celebrate__icon">
        <PartyPopper size={40} aria-hidden />
      </div>
      <div className="celebrate__eyebrow">Level {level.id} complete</div>
      <h2 id="celebrate-title" className="celebrate__title">
        The site stayed up.
      </h2>
      <p className="celebrate__sub">Traffic reached {fmt(level.targetQps)} QPS and nothing crossed 100%.</p>
      {score && <Stars earned={score.stars} size={34} nextAt={score.nextStarAt} />}
      {score && <ScoreTable score={score} />}
      {level.lesson && <Lesson lesson={level.lesson} />}
      {score && !score.bonus && (
        <p className="celebrate__tip">Keep every component under 80% for a +50 bonus.</p>
      )}
      <div className="celebrate__actions">
        <button className="btn" onClick={onClose}>
          Keep tinkering
        </button>
        {hasNext && (
          <button className="btn btn--ok" onClick={onNext}>
            Next level
          </button>
        )}
      </div>
      {!hasNext && <div className="verdict__note">That's the last level for now.</div>}
    </Modal>
  )
}
