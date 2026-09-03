import { CATALOGUE } from '../sim/catalogue'
import type { IntroStep, Level } from '../sim/types'
import { fmt } from './format'

/**
 * Walkthrough steps for a level. A level can hand-write its own (level 0 does);
 * otherwise it gets a quick two-beat intro built from its data: the story and
 * goal, then a spotlight on whatever it unlocks.
 */
export function introFor(level: Level): IntroStep[] {
  if (level.intro) return level.intro
  const steps: IntroStep[] = [
    {
      title: `Level ${level.id}: ${level.title}`,
      body: [
        level.brief,
        `Target: ${fmt(level.targetQps)} requests a second on a $${level.budget} budget.`,
      ],
    },
  ]
  for (const type of level.introduces ?? []) {
    const spec = CATALOGUE[type]
    steps.push({
      target: 'new',
      title: `New from Bmazon: ${spec.label}`,
      body: [spec.blurb, `Max ${fmt(spec.capacity)} QPS for $${spec.cost}. It's in the tray now.`],
    })
  }
  return steps
}
