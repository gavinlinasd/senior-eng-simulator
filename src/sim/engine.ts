import { CATALOGUE } from './catalogue'
import type { BreakingPoint, Evaluation, Graph, Shares, Status } from './types'

/** Utilization at which a node turns amber. Staying under this everywhere earns the score bonus. */
export const WARN_AT = 0.8
/** Utilization at which a node turns red. */
export const RED_AT = 0.9
/** Utilization at which a node is overloaded and the run stops. */
export const FAIL_AT = 1

/**
 * Kahn's algorithm. Returns null if the graph has a cycle.
 * Edges that reference unknown nodes are ignored so the UI can hand over
 * a graph mid-edit without crashing the engine.
 */
export function topoOrder(graph: Graph): string[] | null {
  const indeg: Record<string, number> = {}
  const adj: Record<string, string[]> = {}
  for (const n of graph.nodes) {
    indeg[n.id] = 0
    adj[n.id] = []
  }
  for (const e of graph.edges) {
    if (!(e.from in adj) || !(e.to in indeg)) continue
    adj[e.from].push(e.to)
    indeg[e.to]++
  }
  const queue = graph.nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id)
  const order: string[] = []
  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    for (const t of adj[id]) if (--indeg[t] === 0) queue.push(t)
  }
  return order.length === graph.nodes.length ? order : null
}

/**
 * Fraction of user traffic that lands on each node. Walks the DAG in topological
 * order; a "split" node divides its share across outgoing edges, a "fanout" node
 * sends its full share down each. Returns null if the graph has a cycle.
 */
export function computeShares(graph: Graph): Shares | null {
  const order = topoOrder(graph)
  if (!order) return null
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const shares: Shares = {}
  for (const n of graph.nodes) shares[n.id] = n.type === 'users' ? 1 : 0
  for (const id of order) {
    const outs = graph.edges.filter((e) => e.from === id && byId.has(e.to))
    if (outs.length === 0) continue
    const node = byId.get(id)!
    const each = CATALOGUE[node.type].distribute === 'split' ? shares[id] / outs.length : shares[id]
    for (const e of outs) shares[e.to] += each
  }
  return shares
}

/** Load and utilization of every node at a given QPS. The model is linear: load = share × qps. */
export function evaluate(graph: Graph, shares: Shares | null, qps: number): Evaluation {
  const out: Evaluation = {}
  for (const n of graph.nodes) {
    const load = (shares?.[n.id] ?? 0) * qps
    const cap = CATALOGUE[n.type].capacity
    out[n.id] = { load, util: Number.isFinite(cap) ? load / cap : 0 }
  }
  return out
}

/** Lowest QPS at which some node reaches 100%, and which node. Null if nothing can saturate. */
export function breakingPoint(graph: Graph, shares: Shares | null): BreakingPoint | null {
  let best: BreakingPoint | null = null
  for (const n of graph.nodes) {
    const cap = CATALOGUE[n.type].capacity
    const s = shares?.[n.id] ?? 0
    if (!Number.isFinite(cap) || s <= 0) continue
    const qps = (cap * FAIL_AT) / s
    if (!best || qps < best.qps) best = { qps, nodeId: n.id }
  }
  return best
}

/** A design passes when nothing reaches 100% at or before the target. */
export function passes(bp: BreakingPoint | null, targetQps: number): boolean {
  return bp === null || bp.qps > targetQps
}

/** Highest utilization across all nodes at a given QPS. */
export function peakUtilization(graph: Graph, shares: Shares | null, qps: number): number {
  const results = evaluate(graph, shares, qps)
  let peak = 0
  for (const r of Object.values(results)) if (r.util > peak) peak = r.util
  return peak
}

export function statusOf(util: number): Status {
  if (util >= RED_AT) return 'over'
  if (util >= WARN_AT) return 'warn'
  return 'ok'
}
