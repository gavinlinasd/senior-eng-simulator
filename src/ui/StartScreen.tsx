import { Play } from 'lucide-react'
import { GAME_GOAL, GAME_NAME_FULL, PROVIDER } from './brand'

/** The title screen. One page, one button. */
export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="start">
      <div className="start__inner">
        <div className="start__eyebrow">{PROVIDER} presents</div>
        <h1 className="start__title">{GAME_NAME_FULL}</h1>
        <p className="start__subtitle">{GAME_GOAL}</p>
        <p className="start__goal">
          Wire up servers, balancers and caches. Send traffic. Every component has a limit, and when one hits 100% the
          site is down. Keep it up as the internet finds you.
        </p>
        <button className="start__button" onClick={onStart} autoFocus>
          <Play size={18} aria-hidden /> Start
        </button>
        <div className="start__meta">4 levels · nothing to install · no account</div>
      </div>
    </main>
  )
}
