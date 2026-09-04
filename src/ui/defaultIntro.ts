import type { IntroStep, Level } from '../sim/types'
import { classesIn } from './classes'

/**
 * Walkthrough steps for a level. A level can hand-write its own (level 0's
 * guided tutorial does); otherwise it gets a single page built from its data:
 * the story and goal, the traffic mix if it has one, and a card for anything
 * it unlocks.
 */
export function introFor(level: Level): IntroStep[] {
  if (level.intro) return level.intro
  const hasMix = classesIn(level.traffic).length > 1
  return [
    {
      title: `Level ${level.id}: ${level.title}`,
      body: [level.brief, ...(level.introNotes ?? [])],
      showGoal: true,
      showMix: hasMix,
      cards: level.introduces,
    },
  ]
}
