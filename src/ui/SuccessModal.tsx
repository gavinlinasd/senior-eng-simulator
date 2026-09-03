import { useState } from 'react'
import { PartyPopper } from 'lucide-react'
import type { Level, Score } from '../sim/types'
import { fmt } from './format'
import { Modal } from './Modal'
import { ScoreTable } from './ScoreTable'

interface SuccessModalProps {
  open: boolean
  level: Level
  score: Score | null
  onClose: () => void
}

export function SuccessModal({ open, level, score, onClose }: SuccessModalProps) {
  const [nextNote, setNextNote] = useState(false)

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
      {score && <ScoreTable score={score} />}
      {score && !score.bonus && (
        <p className="celebrate__tip">Keep every component under 80% for a +50 bonus.</p>
      )}
      <div className="celebrate__actions">
        <button className="btn" onClick={onClose}>
          Keep tinkering
        </button>
        <button className="btn btn--ok" onClick={() => setNextNote(true)}>
          Next level
        </button>
      </div>
      {nextNote && <div className="verdict__note">Level 2 isn't built yet.</div>}
    </Modal>
  )
}
