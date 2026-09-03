import { CATALOGUE } from './catalogue'
import type { BreakingPoint, ClassLoad, Evaluation, Graph, Shares, Status } from './types'

/** Utilization at which a node turns amber. Staying under this everywhere earns the score bonus. */
export const WARN_AT = 0.8
/** Utilization at which a node turns red. */
export const RED_AT = 0.9
/** Utilization at which a node is overloaded and the run stops. */
export const FAIL_AT = 1

export const ALL_READS: ClassLoad = { read: 1, write: 0 }

export const total = (c: ClassLoad) => c.read + c.write

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
 * Fraction of user traffic that lands on each node, by class. Walks the DAG in
 * topological order. A "split" node divides its share across outgoing edges, a
 * "fanout" node sends its full share down each. A neighbour that absorbs a
 * class (a cache-aside cache) receives that class as lookups and the absorbed
 * fraction never flows down the node's other wires. Returns null on a cycle.
 */
export function computeShares(graph: Graph, traffic: ClassLoad = ALL_READS): Shares | null {
  const order = topoOrder(graph)
  if (!order) return null
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const shares: Shares = {}
  for (const n of graph.nodes) shares[n.id] = n.type === 'users' ? { ...traffic } : { read: 0, write: 0 }

  for (const id of order) {
    const outs = graph.edges.filter((e) => e.from === id && byId.has(e.to))
    if (outs.length === 0) continue
    const node = byId.get(id)!
    const s = shares[id]

    // Cache-aside neighbours take their class as lookups; the rest continues on.
    const absorbed: ClassLoad = { read: 0, write: 0 }
    const onward = outs.filter((e) => {
      const absorbs = CATALOGUE[byId.get(e.to)!.type].absorbs
      if (!absorbs) return true
      const target = shares[e.to]
      if (absorbs.read !== undefined) {
        target.read += s.read
        absorbed.read = Math.max(absorbed.read, s.read * absorbs.read)
      }
      if (absorbs.write !== undefined) {
        target.write += s.write
        absorbed.write = Math.max(absorbed.write, s.write * absorbs.write)
      }
      return false
    })
    if (onward.length === 0) continue

    const remaining: ClassLoad = { read: s.read - absorbed.read, write: s.write - absorbed.write }
    const divisor = CATALOGUE[node.type].distribute === 'split' ? onward.length : 1
    for (const e of onward) {
      shares[e.to].read += remaining.read / divisor
      shares[e.to].write += remaining.write / divisor
    }
  }
  return shares
}

/** Load and utilization of every node at a given QPS. The model is linear: load = share × qps. */
export function evaluate(graph: Graph, shares: Shares | null, qps: number): Evaluation {
  const out: Evaluation = {}
  for (const n of graph.nodes) {
    const s = shares?.[n.id] ?? { read: 0, write: 0 }
    const read = s.read * qps
    const write = s.write * qps
    const load = read + write
    const cap = CATALOGUE[n.type].capacity
    out[n.id] = { load, read, write, util: Number.isFinite(cap) ? load / cap : 0 }
  }
  return out
}

/** Lowest QPS at which some node reaches 100%, and which node. Null if nothing can saturate. */
export function breakingPoint(graph: Graph, shares: Shares | null): BreakingPoint | null {
  let best: BreakingPoint | null = null
  for (const n of graph.nodes) {
    const cap = CATALOGUE[n.type].capacity
    const s = shares ? total(shares[n.id]) : 0
    if (!Number.isFinite(cap) || s <= 0) continue
    const qps = (cap * FAIL_AT) / s
    if (!best || qps < best.qps) best = { qps, nodeId: n.id }
  }
  return best
}

/** Relative slack so float noise from summing split shares can't flip a verdict. */
const EPSILON = 1e-9

/** A design passes when nothing reaches 100% at or before the target. */
export function passes(bp: BreakingPoint | null, targetQps: number): boolean {
  return bp === null || bp.qps > targetQps * (1 + EPSILON)
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
