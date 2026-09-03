import { CATALOGUE, costOf } from './catalogue'
import { ALL_READS, computeShares, total } from './engine'
import type { Graph, Level } from './types'

/** Problems that block a run. Empty array means the graph can be simulated. */
export function validate(graph: Graph, level: Level): string[] {
  const errors: string[] = []
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const shares = computeShares(graph, level.traffic ?? ALL_READS)
  if (!shares) errors.push('Requests are going around in a loop. Remove the cycle.')

  const userIds = new Set(graph.nodes.filter((n) => n.type === 'users').map((n) => n.id))
  const userOuts = graph.edges.filter((e) => userIds.has(e.from))
  if (userOuts.length === 0) errors.push("Users aren't connected to anything yet.")
  if (userOuts.length > 1) errors.push('Users only know one address. Connect them to exactly one component.')

  // Wire rules from the catalogue.
  for (const e of graph.edges) {
    const from = byId.get(e.from)
    const to = byId.get(e.to)
    if (!from || !to) continue
    const rule = CATALOGUE[to.type].acceptsFrom
    if (rule && !rule.types.includes(from.type)) {
      errors.push(`${to.name} can't be wired from ${from.name}. ${rule.reason}`)
    }
    if (CATALOGUE[from.type].sink) {
      errors.push(`${from.name} doesn't forward requests. Remove the wire out of it.`)
    }
  }

  if (shares) {
    for (const n of graph.nodes) {
      const outs = graph.edges.filter((e) => e.from === n.id && byId.has(e.to))
      if (n.type !== 'users' && total(shares[n.id]) === 0) {
        errors.push(`${n.name} isn't receiving any traffic. Connect it or remove it.`)
      }
      if (CATALOGUE[n.type].needsDownstream && outs.length === 0) {
        errors.push(`${n.name} has nowhere to send requests.`)
      }
      const hasCache = outs.some((e) => CATALOGUE[byId.get(e.to)!.type].absorbs)
      const hasOnward = outs.some((e) => !CATALOGUE[byId.get(e.to)!.type].absorbs)
      if (hasCache && !hasOnward) {
        errors.push(`Cache misses from ${n.name} have nowhere to go. Wire it to the database too.`)
      }
    }
  }

  const cost = costOf(graph)
  if (cost > level.budget) errors.push(`Over budget by $${cost - level.budget}.`)
  return errors
}
