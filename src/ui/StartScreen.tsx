import { Play } from 'lucide-react'
import { GAME_GOAL, GAME_NAME_FULL } from './brand'

interface StartScreenProps {
  onStart: () => void
  /** Slide up and out; onGone fires when the animation ends. */
  leaving?: boolean
  onGone?: () => void
}

/** The title screen. One page, one button. */
export function StartScreen({ onStart, leaving = false, onGone }: StartScreenProps) {
  return (
    <main className={leaving ? 'start is-leaving' : 'start'} onAnimationEnd={leaving ? onGone : undefined}>
      <div className="start__inner">
        <h1 className="start__title">{GAME_NAME_FULL}</h1>
        <p className="start__subtitle">{GAME_GOAL}</p>
        <button className="start__button" onClick={onStart} autoFocus disabled={leaving}>
          <Play size={18} aria-hidden /> Start
        </button>
      </div>
    </main>
  )
}
