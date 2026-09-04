import type { IntroStep, Level } from '../sim/types'
import { fmt } from './format'

/**
 * Walkthrough steps for a level. A level can hand-write its own (level 0's
 * guided tutorial does); otherwise it gets a single page built from its data:
 * the story and goal, the traffic mix if it has one, and a card for anything
 * it unlocks.
 */
export function introFor(level: Level): IntroStep[] {
  if (level.intro) return level.intro
  const hasMix = Boolean(level.traffic && (level.traffic.private > 0 || level.traffic.write > 0))
  return [
    {
      title: `Level ${level.id}: ${level.title}`,
      body: [
        level.brief,
        `Target: ${fmt(level.targetQps)} requests a second on a $${level.budget} budget.`,
        ...(level.introNotes ?? []),
      ],
      showMix: hasMix,
      cards: level.introduces,
    },
  ]
}
