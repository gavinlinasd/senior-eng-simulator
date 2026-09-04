import { CATALOGUE } from './catalogue'
import type { BreakingPoint, ClassLoad, Evaluation, Graph, HitCurve, Loads, Status, TrafficClass } from './types'

/** Utilization at which a node turns amber. Staying under this everywhere earns the score bonus. */
export const WARN_AT = 0.8
/** Utilization at which a node turns red. */
export const RED_AT = 0.9
/** Utilization at which a node is overloaded and the run stops. */
export const FAIL_AT = 1

export const ALL_PUBLIC: ClassLoad = { public: 1, private: 0, write: 0 }
export const CLASSES: TrafficClass[] = ['public', 'private', 'write']

export const zero = (): ClassLoad => ({ public: 0, private: 0, write: 0 })
export const total = (c: ClassLoad) => c.public + c.private + c.write
export const reads = (c: ClassLoad) => c.public + c.private

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

/** Hit rate of a cache seeing this many lookups per second. */
export function hitRate(curve: HitCurve, lookups: number): number {
  if (lookups <= 0) return 0
  const h = curve.baseRate + curve.perDoubling * Math.log2(lookups / curve.baseLoad)
  return Math.min(curve.max, Math.max(0, h))
}

export interface CacheStats {
  /** Fraction of all lookups answered. */
  rate: number
  /** Fraction of each read class answered. */
  rates: { public: number; private: number }
}

export interface LoadResult {
  loads: Loads
  /** Per cache: how well it served at this load. */
  caches: Record<string, CacheStats>
}

/**
 * Requests per second arriving at every node, by class, when users send `qps`.
 *
 * Walks the DAG in topological order. A "split" node divides what it received
 * across its outgoing wires, a "fanout" node sends all of it down each. A cache
 * wired from a node receives, as lookups, the classes that node type may cache;
 * the cache's hit rate comes from its total lookups from every node feeding it,
 * so the walk resolves a cache once all of its feeders have run and only then
 * sends each feeder's misses and writes down the feeder's other wires.
 *
 * Returns null on a cycle.
 */
export function computeLoads(graph: Graph, qps: number, traffic: ClassLoad = ALL_PUBLIC): LoadResult | null {
  const order = topoOrder(graph)
  if (!order) return null
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const isCache = (id: string) => CATALOGUE[byId.get(id)!.type].hitCurve !== undefined
  const outsOf = (id: string) => graph.edges.filter((e) => e.from === id && byId.has(e.to))

  // Caches are sinks, so pulling each one forward to just after its last feeder
  // keeps the order valid and guarantees it resolves before its feeders' other
  // targets are processed.
  const walk = order.filter((id) => !isCache(id))
  for (const cacheId of order.filter(isCache)) {
    const feeders = graph.edges.filter((e) => e.to === cacheId).map((e) => e.from)
    const at = feeders.length ? Math.max(...feeders.map((f) => walk.indexOf(f))) + 1 : 0
    walk.splice(at, 0, cacheId)
  }

  const loads: Loads = {}
  for (const n of graph.nodes) loads[n.id] = zero()
  for (const n of graph.nodes) {
    if (n.type === 'users') {
      loads[n.id] = { public: traffic.public * qps, private: traffic.private * qps, write: traffic.write * qps }
    }
  }

  // Per cache: the lookups it is allowed to answer, the resulting hit rate, and hits per class.
  const servable: Record<string, { public: number; private: number }> = {}
  const hitOf: Record<string, number> = {}
  const caches: Record<string, CacheStats> = {}
  // Feeders waiting on caches: how many of their caches are unresolved, and what to do once none are.
  const pending = new Map<string, { remaining: number; flush: () => void }>()
  const waitingOn = new Map<string, string[]>()

  const distribute = (fromId: string, amount: ClassLoad, targets: string[]) => {
    const divisor = CATALOGUE[byId.get(fromId)!.type].distribute === 'split' ? targets.length : 1
    for (const t of targets) for (const cls of CLASSES) loads[t][cls] += amount[cls] / divisor
  }

  for (const id of walk) {
    const node = byId.get(id)!
    if (isCache(id)) {
      const can = servable[id] ?? { public: 0, private: 0 }
      const h = hitRate(CATALOGUE[node.type].hitCurve!, can.public + can.private)
      hitOf[id] = h
      const got = loads[id]
      const served = can.public * h + can.private * h
      caches[id] = {
        rate: reads(got) > 0 ? served / reads(got) : 0,
        rates: {
          public: got.public > 0 ? (can.public * h) / got.public : 0,
          private: got.private > 0 ? (can.private * h) / got.private : 0,
        },
      }
      for (const feeder of waitingOn.get(id) ?? []) {
        const p = pending.get(feeder)!
        if (--p.remaining === 0) p.flush()
      }
      continue
    }

    const outs = outsOf(id)
    const cacheOuts = outs.filter((e) => isCache(e.to))
    const onward = outs.filter((e) => !isCache(e.to)).map((e) => e.to)
    const arrived = { ...loads[id] }
    if (cacheOuts.length === 0) {
      if (onward.length) distribute(id, arrived, onward)
      continue
    }

    const cacheable = CATALOGUE[node.type].cacheable ?? []
    for (const e of cacheOuts) {
      // Every read is a lookup, but the cache can only answer what this feeder may cache.
      loads[e.to].public += arrived.public
      loads[e.to].private += arrived.private
      const can = (servable[e.to] ??= { public: 0, private: 0 })
      if (cacheable.includes('public')) can.public += arrived.public
      if (cacheable.includes('private')) can.private += arrived.private
      waitingOn.set(e.to, [...(waitingOn.get(e.to) ?? []), id])
    }
    pending.set(id, {
      remaining: cacheOuts.length,
      flush: () => {
        if (!onward.length) return
        const best = Math.max(...cacheOuts.map((e) => hitOf[e.to]))
        const left = { ...arrived }
        for (const cls of cacheable) left[cls] = arrived[cls] * (1 - best)
        distribute(id, left, onward)
      },
    })
  }

  return { loads, caches }
}

/** Load and utilization of every node at a given QPS. Empty loads (a cycle) evaluate to zero everywhere. */
export function evaluate(graph: Graph, qps: number, traffic: ClassLoad = ALL_PUBLIC): Evaluation {
  const result = computeLoads(graph, qps, traffic)
  const caches = result?.caches ?? {}
  const out: Evaluation = {}
  for (const n of graph.nodes) {
    const c = result?.loads[n.id] ?? zero()
    const load = total(c)
    const cap = CATALOGUE[n.type].capacity
    out[n.id] = { ...c, load, util: Number.isFinite(cap) ? load / cap : 0 }
    if (n.id in caches) {
      out[n.id].hitRate = caches[n.id].rate
      out[n.id].hitRates = caches[n.id].rates
    }
  }
  return out
}

function overloadedAt(graph: Graph, q: number, traffic: ClassLoad): string | null {
  const r = evaluate(graph, q, traffic)
  for (const n of graph.nodes) if (r[n.id].util >= FAIL_AT) return n.id
  return null
}

/**
 * Lowest whole QPS, from 1 to maxQps, at which some node reaches 100%, and
 * which node. Null if nothing does within that range. Cache hit rates change
 * with load, so this is a scan rather than a division: coarse steps first,
 * then the bracket that crossed is walked one QPS at a time.
 */
export function breakingPoint(graph: Graph, traffic: ClassLoad, maxQps: number): BreakingPoint | null {
  if (!topoOrder(graph)) return null
  const step = Math.max(1, Math.floor(maxQps / 200))
  let prev = 0
  for (let q = step; ; q = Math.min(q + step, maxQps)) {
    if (overloadedAt(graph, q, traffic)) {
      for (let fine = prev + 1; fine <= q; fine++) {
        const nodeId = overloadedAt(graph, fine, traffic)
        if (nodeId) return { qps: fine, nodeId }
      }
    }
    if (q >= maxQps) return null
    prev = q
  }
}

/** A design passes when nothing reaches 100% at or before the target. */
export function passes(bp: BreakingPoint | null, targetQps: number): boolean {
  return bp === null || bp.qps > targetQps
}

/** Highest utilization across all nodes at a given QPS. */
export function peakUtilization(graph: Graph, qps: number, traffic: ClassLoad): number {
  let peak = 0
  for (const r of Object.values(evaluate(graph, qps, traffic))) if (r.util > peak) peak = r.util
  return peak
}

export function statusOf(util: number): Status {
  if (util >= RED_AT) return 'over'
  if (util >= WARN_AT) return 'warn'
  return 'ok'
}
