import { CATALOGUE, costOf } from './catalogue'
import { computeShares } from './engine'
import type { Graph, Level } from './types'

/** Problems that block a run. Empty array means the graph can be simulated. */
export function validate(graph: Graph, level: Level): string[] {
  const errors: string[] = []
  const shares = computeShares(graph)
  if (!shares) errors.push('Requests are going around in a loop. Remove the cycle.')

  const userIds = new Set(graph.nodes.filter((n) => n.type === 'users').map((n) => n.id))
  const userOuts = graph.edges.filter((e) => userIds.has(e.from))
  if (userOuts.length === 0) errors.push("Users aren't connected to anything yet.")
  if (userOuts.length > 1) errors.push('Users only know one address. Connect them to exactly one component.')

  if (shares) {
    for (const n of graph.nodes) {
      if (n.type !== 'users' && shares[n.id] === 0) {
        errors.push(`${n.name} isn't receiving any traffic. Connect it or remove it.`)
      }
      if (CATALOGUE[n.type].needsDownstream && !graph.edges.some((e) => e.from === n.id)) {
        errors.push(`${n.name} has nowhere to send requests.`)
      }
    }
  }

  const cost = costOf(graph)
  if (cost > level.budget) errors.push(`Over budget by $${cost - level.budget}.`)
  return errors
}
