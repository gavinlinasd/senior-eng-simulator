import { CATALOGUE, costOf } from './catalogue'
import { ALL_PUBLIC, evaluate, topoOrder } from './engine'
import type { Graph, Level } from './types'

/** Problems that block a run. Empty array means the graph can be simulated. */
export function validate(graph: Graph, level: Level): string[] {
  const errors: string[] = []
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const acyclic = topoOrder(graph) !== null
  if (!acyclic) errors.push('Requests are going around in a loop. Remove the cycle.')

  const userIds = new Set(graph.nodes.filter((n) => CATALOGUE[n.type].source).map((n) => n.id))
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

  if (acyclic) {
    const results = evaluate(graph, level.targetQps, level.traffic ?? ALL_PUBLIC)
    for (const n of graph.nodes) {
      const outs = graph.edges.filter((e) => e.from === n.id && byId.has(e.to))
      if (!CATALOGUE[n.type].source && results[n.id].load === 0) {
        errors.push(`${n.name} isn't receiving any traffic. Connect it or remove it.`)
      }
      if (CATALOGUE[n.type].needsDownstream && outs.length === 0) {
        errors.push(`${n.name} has nowhere to send requests.`)
      }
      const isCache = (id: string) => CATALOGUE[byId.get(id)!.type].hitCurve !== undefined
      const hasCache = outs.some((e) => isCache(e.to))
      const hasOnward = outs.some((e) => !isCache(e.to))
      if (hasCache && !hasOnward) {
        errors.push(`Cache misses from ${n.name} have nowhere to go. Wire it onward as well.`)
      }
      if (level.requiresDatabase && CATALOGUE[n.type].serves && !outs.some((e) => CATALOGUE[byId.get(e.to)!.type].store)) {
        errors.push(`${n.name} isn't wired to the database. Every request needs it.`)
      }
    }
  }

  const cost = costOf(graph)
  if (cost > level.budget) errors.push(`Over budget by $${cost - level.budget}.`)
  return errors
}
