import { CATALOGUE, costOf } from './catalogue'
import { ALL_PUBLIC, breakingPoint, evaluate, passes, peakUtilization, WARN_AT } from './engine'
import type { Graph, Level, Score } from './types'

export const PASS_POINTS = 100
export const GREEN_BONUS = 50

/**
 * Score for a passing design, null if it fails. Everything is measured at the
 * target. Headroom is the spare percentage summed over every scored node (web
 * servers and the database); caches and load balancers don't count.
 */
export function score(graph: Graph, level: Level): Score | null {
  const traffic = level.traffic ?? ALL_PUBLIC
  if (!passes(breakingPoint(graph, traffic, level.targetQps), level.targetQps)) return null
  const results = evaluate(graph, level.targetQps, traffic)
  const peakUtil = peakUtilization(graph, level.targetQps, traffic)
  let spare = 0
  for (const n of graph.nodes) {
    if (CATALOGUE[n.type].scored) spare += (1 - results[n.id].util) * 100
  }
  const headroom = Math.round(spare)
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
