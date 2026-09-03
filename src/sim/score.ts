import { CATALOGUE, costOf } from './catalogue'
import { breakingPoint, evaluate, passes, peakUtilization, WARN_AT } from './engine'
import type { Graph, Level, Score, Shares } from './types'

export const PASS_POINTS = 100
export const GREEN_BONUS = 50

/**
 * Score for a passing design, null if it fails. Because the model is linear the
 * worst moment of any run is at the target, so everything is measured there.
 * Headroom is the spare percentage summed over every scored node (web servers
 * and the database); caches and load balancers don't count.
 */
export function score(graph: Graph, shares: Shares | null, level: Level): Score | null {
  if (!passes(breakingPoint(graph, shares), level.targetQps)) return null
  const results = evaluate(graph, shares, level.targetQps)
  const peakUtil = peakUtilization(graph, shares, level.targetQps)
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
