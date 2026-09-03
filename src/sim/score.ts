import { costOf } from './catalogue'
import { breakingPoint, passes, peakUtilization, WARN_AT } from './engine'
import type { Graph, Level, Score, Shares } from './types'

export const PASS_POINTS = 100
export const GREEN_BONUS = 50

/**
 * Score for a passing design, null if it fails. Because the model is linear the
 * worst moment of any run is at the target, so "under 80% at all times" is
 * checked there.
 */
export function score(graph: Graph, shares: Shares | null, level: Level): Score | null {
  if (!passes(breakingPoint(graph, shares), level.targetQps)) return null
  const peakUtil = peakUtilization(graph, shares, level.targetQps)
  const headroom = Math.round((1 - peakUtil) * 100)
  const budgetLeft = Math.max(0, level.budget - costOf(graph))
  const bonus = peakUtil < WARN_AT ? GREEN_BONUS : 0
  return {
    base: PASS_POINTS,
    headroom,
    budgetLeft,
    bonus,
    total: PASS_POINTS + headroom + budgetLeft + bonus,
    peakUtil,
  }
}
