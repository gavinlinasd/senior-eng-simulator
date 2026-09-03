import { LEVELS } from '../levels'
import { Modal } from './Modal'

interface LevelPickerModalProps {
  open: boolean
  current: number
  onPick: (index: number) => void
  onClose: () => void
}

/** Jump to any level. The level starts from its fresh board. */
export function LevelPickerModal({ open, current, onPick, onClose }: LevelPickerModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="modal picker" labelledBy="picker-title">
      <h2 id="picker-title" className="picker__title">
        Jump to a level
      </h2>
      <p className="picker__hint">Each level starts from its own board. Your current board is not carried.</p>
      <div className="picker__list">
        {LEVELS.map((level, i) => (
          <button
            key={level.id}
            className={i === current ? 'picker__item is-current' : 'picker__item'}
            onClick={() => {
              onPick(i)
              onClose()
            }}
          >
            <span className="picker__level">Level {level.id}</span>
            <span className="picker__name">{level.title}</span>
          </button>
        ))}
      </div>
      <div className="picker__actions">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
