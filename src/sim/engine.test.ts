import { describe, expect, it } from 'vitest'
import { ALL_PUBLIC, breakingPoint, evaluate, hitRate, passes, peakUtilization, statusOf } from './engine'
import { validate } from './validate'
import { behindLb, chain, edge, node, repeat } from './fixtures'
import { level1 } from '../levels/level1'
import { CATALOGUE } from './catalogue'

const MIX = { public: 0.4, private: 0.5, write: 0.1 }
const BIG = 100_000

describe('computeLoads via evaluate', () => {
  it('passes the full load down a chain (fan-out)', () => {
    const r = evaluate(chain('web', 'web'), 100)
    expect(r.users.load).toBe(100)
    expect(r.web1.load).toBe(100)
    expect(r.web2.load).toBe(100)
  })

  it('splits evenly through a load balancer', () => {
    const r = evaluate(behindLb('web', 'web'), 400)
    expect(r.lb1).toMatchObject({ load: 400, util: 400 / 5000 })
    expect(r.web1).toMatchObject({ load: 200, util: 200 / 300 })
    expect(r.web2.load).toBe(200)
  })

  it('evaluates to zero everywhere on a cycle', () => {
    const g = chain('web', 'web')
    g.edges.push(edge('web2', 'web1'))
    expect(evaluate(g, 100).web1.load).toBe(0)
  })

  it('gives no load to a node nothing points at', () => {
    const g = chain('web')
    g.nodes.push(node('web', 'orphan'))
    expect(evaluate(g, 100).orphan.load).toBe(0)
  })

  it('splits user traffic into classes', () => {
    const r = evaluate(chain('web'), 1000, MIX)
    expect(r.web1).toMatchObject({ public: 400, private: 500, write: 100, load: 1000 })
  })
})

describe('breakingPoint', () => {
  it('start graph breaks at 300 QPS on web1', () => {
    expect(breakingPoint(level1.start, ALL_PUBLIC, BIG)).toEqual({ qps: 300, nodeId: 'web1' })
  })

  it('one large server straight from users breaks at 600', () => {
    expect(breakingPoint(chain('bigweb'), ALL_PUBLIC, BIG)).toEqual({ qps: 600, nodeId: 'bigweb1' })
  })

  it('a small server next to a large one behind an LB saturates first', () => {
    expect(breakingPoint(behindLb('bigweb', 'web'), ALL_PUBLIC, BIG)).toEqual({ qps: 600, nodeId: 'web1' })
  })

  it('returns null when nothing saturates within the range', () => {
    expect(breakingPoint({ nodes: [node('users', 'users')], edges: [] }, ALL_PUBLIC, BIG)).toBeNull()
    expect(breakingPoint(behindLb(...repeat('web', 4)), ALL_PUBLIC, 1000)).toBeNull()
    expect(breakingPoint(behindLb(...repeat('web', 4)), ALL_PUBLIC, BIG)).toEqual({ qps: 1200, nodeId: 'web1' })
  })
})

describe('passes', () => {
  const target = level1.targetQps

  it('LB + 4 web servers passes at 83%', () => {
    const g = behindLb(...repeat('web', 4))
    expect(passes(breakingPoint(g, ALL_PUBLIC, target), target)).toBe(true)
    expect(peakUtilization(g, target, ALL_PUBLIC)).toBeCloseTo(0.8333, 3)
    expect(statusOf(peakUtilization(g, target, ALL_PUBLIC))).toBe('warn')
  })

  it('LB + 5 web servers passes in the green', () => {
    const g = behindLb(...repeat('web', 5))
    expect(passes(breakingPoint(g, ALL_PUBLIC, target), target)).toBe(true)
    expect(statusOf(peakUtilization(g, target, ALL_PUBLIC))).toBe('ok')
  })

  it('LB + 2 large servers passes at 83%', () => {
    const g = behindLb('bigweb', 'bigweb')
    expect(passes(breakingPoint(g, ALL_PUBLIC, target), target)).toBe(true)
    expect(peakUtilization(g, target, ALL_PUBLIC)).toBeCloseTo(0.8333, 3)
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

describe('cache-aside with a load-dependent hit rate', () => {
  const curve = CATALOGUE.cache.hitCurve!

  it('hit rate follows the curve: 80% at 500 lookups, 90% at 1,000, capped at 95%', () => {
    expect(hitRate(curve, 500)).toBeCloseTo(0.8, 10)
    expect(hitRate(curve, 1000)).toBeCloseTo(0.9, 10)
    expect(hitRate(curve, 250)).toBeCloseTo(0.7, 10)
    expect(hitRate(curve, 4000)).toBe(0.95)
    expect(hitRate(curve, 0)).toBe(0)
  })

  it('a web server without a cache sends everything on, as before', () => {
    expect(evaluate(chain('web', 'db'), 1000, MIX).db1).toMatchObject({ public: 400, private: 500, write: 100 })
  })

  it('a cache on a web server takes public and private reads as lookups; misses and writes reach the database', () => {
    const g = chain('web', 'db')
    g.nodes.push(node('cache', 'cache1'))
    g.edges.push(edge('web1', 'cache1'))
    const r = evaluate(g, 1000, MIX)
    expect(r.cache1).toMatchObject({ public: 400, private: 500, write: 0, load: 900, hitRate: hitRate(curve, 900) })
    const miss = 1 - hitRate(curve, 900)
    expect(r.db1.public).toBeCloseTo(400 * miss, 6)
    expect(r.db1.private).toBeCloseTo(500 * miss, 6)
    expect(r.db1.write).toBe(100)
  })

  it('a cache on the load balancer serves only public reads', () => {
    const g = behindLb('web', 'web')
    g.nodes.push(node('cache', 'edge'), node('db', 'db1'))
    g.edges.push(edge('lb1', 'edge'), edge('web1', 'db1'), edge('web2', 'db1'))
    const r = evaluate(g, 1000, MIX)
    expect(r.edge).toMatchObject({ public: 400, private: 0, write: 0, load: 400 })
    const miss = 1 - hitRate(curve, 400)
    expect(r.web1.public).toBeCloseTo((400 * miss) / 2, 6)
    expect(r.web1.private).toBe(250)
    expect(r.web1.write).toBe(50)
  })

  it('one shared cache warms up more than one cache per server', () => {
    const shared = behindLb(...repeat('web', 4))
    shared.nodes.push(node('cache', 'cache1'), node('db', 'db1'))
    for (let i = 1; i <= 4; i++) shared.edges.push(edge(`web${i}`, 'cache1'), edge(`web${i}`, 'db1'))
    const split = behindLb(...repeat('web', 4))
    split.nodes.push(node('db', 'db1'))
    for (let i = 1; i <= 4; i++) {
      split.nodes.push(node('cache', `cache${i}`))
      split.edges.push(edge(`web${i}`, `cache${i}`), edge(`web${i}`, 'db1'))
    }
    const a = evaluate(shared, 2000, MIX)
    const b = evaluate(split, 2000, MIX)
    expect(a.cache1.hitRate!).toBeGreaterThan(b.cache1.hitRate!)
    expect(a.db1.load).toBeLessThan(b.db1.load)
  })

  it('the hit rate uses lookups from every feeder, whatever the node order', () => {
    // Feeders listed after the database and the cache, so the walk must reorder.
    const g = {
      nodes: [node('db', 'db1'), node('cache', 'cache1'), node('users', 'users'), node('lb', 'lb1'), node('web', 'web1'), node('web', 'web2')],
      edges: [
        edge('users', 'lb1'),
        edge('lb1', 'web1'),
        edge('lb1', 'web2'),
        edge('web1', 'db1'),
        edge('web2', 'db1'),
        edge('web1', 'cache1'),
        edge('web2', 'cache1'),
      ],
    }
    const r = evaluate(g, 1000, MIX)
    expect(r.cache1.load).toBe(900)
    expect(r.cache1.hitRate).toBeCloseTo(hitRate(curve, 900), 10)
    expect(r.db1.load).toBeCloseTo(900 * (1 - hitRate(curve, 900)) + 100, 6)
  })

  it('wire rules: users to cache, cache forwarding, cache with no fallback', () => {
    const level = { ...level1, traffic: MIX }
    expect(validate(chain('cache'), level)).toContainEqual(expect.stringContaining("Cache cache1 can't be wired from Users"))
    expect(validate(chain('web', 'cache', 'db'), level)).toContainEqual(expect.stringContaining("doesn't forward requests"))
    expect(validate(chain('web', 'cache'), level)).toContainEqual(expect.stringContaining('have nowhere to go'))
    const edgeOnly = behindLb('web')
    edgeOnly.nodes.push(node('cache', 'edge'))
    edgeOnly.edges.push(edge('lb1', 'edge'))
    expect(validate(edgeOnly, level)).toEqual([])
  })
})
