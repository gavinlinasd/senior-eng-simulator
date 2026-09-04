import { Play } from 'lucide-react'
import { GAME_GOAL, GAME_NAME_FULL } from './brand'

/** The title screen. One page, one button. */
export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="start">
      <div className="start__inner">
        <h1 className="start__title">{GAME_NAME_FULL}</h1>
        <p className="start__subtitle">{GAME_GOAL}</p>
        <button className="start__button" onClick={onStart} autoFocus>
          <Play size={18} aria-hidden /> Start
        </button>
      </div>
    </main>
  )
}
