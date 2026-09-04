import { describe, expect, it } from 'vitest'
import { LEVELS } from './index'
import { level0 } from './level0'
import { level3 } from './level3'
import { ALL_PUBLIC, breakingPoint, passes, peakUtilization } from '../sim/engine'
import { validate } from '../sim/validate'
import { score } from '../sim/score'
import { chain, edge, node } from '../sim/fixtures'
import { costOf } from '../sim/catalogue'
import type { Graph } from '../sim/types'

describe('levels', () => {
  it('are ordered by id and every start graph is valid', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([0, 1, 2, 3])
    for (const level of LEVELS) {
      expect(validate(level.start, level)).toEqual([])
      for (const t of level.introduces ?? []) expect(level.palette).toContain(t)
      for (const id of Object.keys(level.carryOver?.wireFrom ?? {})) {
        expect(level.carryOver?.add.map((n) => n.id)).toContain(id)
      }
      if (level.traffic) expect(level.traffic.public + level.traffic.private + level.traffic.write).toBeCloseTo(1, 10)
    }
  })

  it('level 0 starts on one small server that breaks at 300', () => {
    expect(breakingPoint(level0.start, ALL_PUBLIC, 10_000)).toEqual({ qps: 300, nodeId: 'web1' })
  })

  it('level 0 passes with one large server at 83%', () => {
    const g = chain('bigweb')
    expect(validate(g, level0)).toEqual([])
    expect(passes(breakingPoint(g, ALL_PUBLIC, level0.targetQps), level0.targetQps)).toBe(true)
    expect(peakUtilization(g, level0.targetQps, ALL_PUBLIC)).toBeCloseTo(0.8333, 3)
  })
})

describe('level 3 has solutions and traps', () => {
  const clone = (g: Graph): Graph => ({ nodes: g.nodes.map((n) => ({ ...n })), edges: g.edges.map((e) => ({ ...e })) })
  const passesLevel = (g: Graph) => validate(g, level3).length === 0 && score(g, level3) !== null

  it('the start board (the level 2 solution) is not enough', () => {
    expect(validate(level3.start, level3)).toEqual([])
    expect(score(level3.start, level3)).toBeNull()
  })

  it('edge cache on the load balancer plus the app cache passes within budget', () => {
    const g = clone(level3.start)
    g.nodes.push(node('cache', 'edge'))
    g.edges.push(edge('lb1', 'edge'))
    expect(passesLevel(g)).toBe(true)
    expect(costOf(g)).toBeLessThanOrEqual(level3.budget)
  })

  it('brute force: twelve small servers and one shared app cache passes, right at budget', () => {
    const g = clone(level3.start)
    for (let i = 7; i <= 12; i++) {
      g.nodes.push(node('web', `web${i}`))
      g.edges.push(edge('lb1', `web${i}`), edge(`web${i}`, 'cache1'), edge(`web${i}`, 'db'))
    }
    expect(passesLevel(g)).toBe(true)
    expect(costOf(g)).toBe(level3.budget)
  })

  it('trap: one cache per server instead of a shared one fails on the database', () => {
    const g = clone(level3.start)
    g.nodes = g.nodes.filter((n) => n.id !== 'cache1')
    g.edges = g.edges.filter((e) => e.to !== 'cache1')
    for (let i = 7; i <= 12; i++) {
      g.nodes.push(node('web', `web${i}`))
      g.edges.push(edge('lb1', `web${i}`), edge(`web${i}`, 'db'))
    }
    for (let i = 1; i <= 6; i++) {
      g.nodes.push(node('cache', `c${i}`))
      g.edges.push(edge(`web${i}`, `c${i}`))
    }
    // still under budget? if not, the trap is budget-blocked rather than db-blocked, which is fine too
    const bp = breakingPoint(g, level3.traffic!, level3.targetQps)
    expect(bp?.nodeId).toBe('db')
  })

  it('trap: edge cache alone, no app cache, fails on the database', () => {
    const g = clone(level3.start)
    g.nodes = g.nodes.filter((n) => n.id !== 'cache1')
    g.edges = g.edges.filter((e) => e.to !== 'cache1')
    g.nodes.push(node('cache', 'edge'))
    g.edges.push(edge('lb1', 'edge'))
    expect(breakingPoint(g, level3.traffic!, level3.targetQps)?.nodeId).toBe('db')
  })
})
