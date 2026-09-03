import { describe, expect, it } from 'vitest'
import { breakingPoint, computeShares, evaluate, passes, peakUtilization, statusOf } from './engine'
import { behindLb, chain, edge, node, repeat } from './fixtures'
import { level1 } from '../levels/level1'

describe('computeShares', () => {
  it('passes the full share down a chain (fan-out)', () => {
    const g = chain('web', 'web')
    expect(computeShares(g)).toEqual({ users: 1, web1: 1, web2: 1 })
  })

  it('splits evenly through a load balancer', () => {
    const g = behindLb('web', 'web')
    expect(computeShares(g)).toEqual({ users: 1, lb1: 1, web1: 0.5, web2: 0.5 })
  })

  it('returns null for a cycle', () => {
    const g = chain('web', 'web')
    g.edges.push(edge('web2', 'web1'))
    expect(computeShares(g)).toBeNull()
  })

  it('gives zero share to a node nothing points at', () => {
    const g = chain('web')
    g.nodes.push(node('web', 'orphan'))
    expect(computeShares(g)?.orphan).toBe(0)
  })
})

describe('evaluate', () => {
  it('computes load and utilization per node', () => {
    const g = behindLb('web', 'web')
    const r = evaluate(g, computeShares(g), 400)
    expect(r.users).toEqual({ load: 400, util: 0 })
    expect(r.lb1).toEqual({ load: 400, util: 400 / 5000 })
    expect(r.web1).toEqual({ load: 200, util: 200 / 300 })
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
