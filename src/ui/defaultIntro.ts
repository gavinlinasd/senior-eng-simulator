import { CATALOGUE } from '../sim/catalogue'
import type { IntroStep, Level } from '../sim/types'
import { fmt } from './format'

/**
 * Walkthrough steps for a level. A level can hand-write its own (level 0's
 * guided tutorial does); otherwise it gets a single page built from its data:
 * the story, the goal, and whatever it unlocks.
 */
export function introFor(level: Level): IntroStep[] {
  if (level.intro) return level.intro
  const body = [level.brief, `Target: ${fmt(level.targetQps)} requests a second on a $${level.budget} budget.`]
  for (const type of level.introduces ?? []) {
    const spec = CATALOGUE[type]
    body.push(`**New from Bmazon: ${spec.label}.** ${spec.blurb} Max ${fmt(spec.capacity)} QPS for $${spec.cost}. It's in the tray now.`)
  }
  return [{ title: `Level ${level.id}: ${level.title}`, body }]
}
