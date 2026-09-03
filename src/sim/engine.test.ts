import { describe, expect, it } from 'vitest'
import { breakingPoint, computeShares, evaluate, passes, peakUtilization, statusOf } from './engine'
import { validate } from './validate'
import { behindLb, chain, edge, node, repeat } from './fixtures'
import { level1 } from '../levels/level1'

const R = (read: number, write = 0) => ({ read, write })
const MIX = { read: 0.9, write: 0.1 }

describe('computeShares', () => {
  it('passes the full share down a chain (fan-out)', () => {
    const g = chain('web', 'web')
    expect(computeShares(g)).toEqual({ users: R(1), web1: R(1), web2: R(1) })
  })

  it('splits evenly through a load balancer', () => {
    const g = behindLb('web', 'web')
    expect(computeShares(g)).toEqual({ users: R(1), lb1: R(1), web1: R(0.5), web2: R(0.5) })
  })

  it('returns null for a cycle', () => {
    const g = chain('web', 'web')
    g.edges.push(edge('web2', 'web1'))
    expect(computeShares(g)).toBeNull()
  })

  it('gives zero share to a node nothing points at', () => {
    const g = chain('web')
    g.nodes.push(node('web', 'orphan'))
    expect(computeShares(g)?.orphan).toEqual(R(0))
  })
})

describe('evaluate', () => {
  it('computes load and utilization per node', () => {
    const g = behindLb('web', 'web')
    const r = evaluate(g, computeShares(g), 400)
    expect(r.users).toEqual({ load: 400, read: 400, write: 0, util: 0 })
    expect(r.lb1).toEqual({ load: 400, read: 400, write: 0, util: 400 / 5000 })
    expect(r.web1).toEqual({ load: 200, read: 200, write: 0, util: 200 / 300 })
  })
})

describe('breakingPoint', () => {
  it('start graph breaks at 300 QPS on web1', () => {
    const g = level1.start
    expect(breakingPoint(g, computeShares(g))).toEqual({ qps: 300, nodeId: 'web1' })
  })

  it('one large server straight from users breaks at 600', () => {
    const g = chain('bigweb')
    expect(breakingPoint(g, computeShares(g))).toEqual({ qps: 600, nodeId: 'bigweb1' })
  })

  it('a small server next to a large one behind an LB saturates first', () => {
    const g = behindLb('bigweb', 'web')
    expect(breakingPoint(g, computeShares(g))).toEqual({ qps: 600, nodeId: 'web1' })
  })

  it('returns null when nothing can saturate', () => {
    const g: ReturnType<typeof chain> = { nodes: [node('users', 'users')], edges: [] }
    expect(breakingPoint(g, computeShares(g))).toBeNull()
  })
})

describe('passes', () => {
  const target = level1.targetQps

  it('LB + 4 web servers passes at 83%', () => {
    const g = behindLb(...repeat('web', 4))
    const shares = computeShares(g)
    expect(passes(breakingPoint(g, shares), target)).toBe(true)
    expect(peakUtilization(g, shares, target)).toBeCloseTo(0.8333, 3)
    expect(statusOf(peakUtilization(g, shares, target))).toBe('warn')
  })

  it('LB + 5 web servers passes in the green', () => {
    const g = behindLb(...repeat('web', 5))
    const shares = computeShares(g)
    expect(passes(breakingPoint(g, shares), target)).toBe(true)
    expect(statusOf(peakUtilization(g, shares, target))).toBe('ok')
  })

  it('LB + 2 large servers passes at 83%', () => {
    const g = behindLb('bigweb', 'bigweb')
    const shares = computeShares(g)
    expect(passes(breakingPoint(g, shares), target)).toBe(true)
    expect(peakUtilization(g, shares, target)).toBeCloseTo(0.8333, 3)
  })

  it('reaching 100% exactly at the target is a fail', () => {
    expect(passes({ qps: target, nodeId: 'x' }, target)).toBe(false)
    expect(passes({ qps: target + 1, nodeId: 'x' }, target)).toBe(true)
    expect(passes(null, target)).toBe(true)
  })
})

describe('statusOf', () => {
  it('turns amber at 80% and red at 90%', () => {
    expect(statusOf(0.79)).toBe('ok')
    expect(statusOf(0.8)).toBe('warn')
    expect(statusOf(0.89)).toBe('warn')
    expect(statusOf(0.9)).toBe('over')
    expect(statusOf(1.2)).toBe('over')
  })
})

describe('traffic classes and cache-aside', () => {
  it('splits user traffic into reads and writes', () => {
    const g = chain('web')
    expect(computeShares(g, MIX)).toEqual({ users: R(0.9, 0.1), web1: R(0.9, 0.1) })
  })

  it('a web server without a cache sends everything on, as before', () => {
    const g = chain('web', 'db')
    expect(computeShares(g, MIX)?.db1).toEqual(R(0.9, 0.1))
  })

  it('a cache takes the reads as lookups and only misses and writes reach the database', () => {
    const g = chain('web', 'db')
    g.nodes.push(node('cache', 'cache1'))
    g.edges.push(edge('web1', 'cache1'))
    const s = computeShares(g, MIX)!
    expect(s.cache1).toEqual(R(0.9, 0))
    expect(s.db1.read).toBeCloseTo(0.9 * 0.15, 10)
    expect(s.db1.write).toBeCloseTo(0.1, 10)
  })

  it('level 2 shape: LB + 6 web + cache + db passes at 1,500 with the database at 70%', () => {
    const g = behindLb(...repeat('web', 6))
    g.nodes.push(node('cache', 'cache1'), node('db', 'db1'))
    for (let i = 1; i <= 6; i++) g.edges.push(edge(`web${i}`, 'cache1'), edge(`web${i}`, 'db1'))
    const s = computeShares(g, MIX)
    const r = evaluate(g, s, 1500)
    expect(r.db1.load).toBeCloseTo(352.5, 5)
    expect(r.db1.util).toBeCloseTo(0.705, 5)
    expect(r.cache1.load).toBeCloseTo(1350, 5)
    expect(r.web1.util).toBeCloseTo(0.8333, 3)
    expect(passes(breakingPoint(g, s), 1500)).toBe(true)
  })

  it('without the cache the database dies at 500 no matter how many web servers', () => {
    const g = behindLb(...repeat('web', 8))
    g.nodes.push(node('db', 'db1'))
    for (let i = 1; i <= 8; i++) g.edges.push(edge(`web${i}`, 'db1'))
    const bp = breakingPoint(g, computeShares(g, MIX))!
    expect(bp.nodeId).toBe('db1')
    expect(bp.qps).toBeCloseTo(500, 6)
  })

  it('wire rules: users to cache, cache forwarding, cache with no fallback', () => {
    const level = { ...level1, traffic: MIX }
    const direct = chain('cache')
    expect(validate(direct, level)).toContainEqual(expect.stringContaining("Cache cache1 can't be wired from Users"))
    const forwarding = chain('web', 'cache', 'db')
    expect(validate(forwarding, level)).toContainEqual(expect.stringContaining("doesn't forward requests"))
    const noFallback = chain('web', 'cache')
    expect(validate(noFallback, level)).toContainEqual(expect.stringContaining('have nowhere to go'))
  })
})
