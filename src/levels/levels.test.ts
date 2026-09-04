import { describe, expect, it } from 'vitest'
import { LEVELS } from './index'
import { board, node } from './build'
import { ALL_PUBLIC, breakingPoint } from '../sim/engine'
import { score } from '../sim/score'
import { validate } from '../sim/validate'
import { costOf } from '../sim/catalogue'

describe('board builder', () => {
  it('names nodes per type, wires adjacent columns all-to-all, and skips sinks as feeders', () => {
    const g = board('users', 'lb', { type: 'web', count: 2 }, ['cache', { type: 'db', id: 'db', locked: true }])
    expect(g.nodes.map((n) => n.id)).toEqual(['users', 'lb1', 'web1', 'web2', 'cache1', 'db'])
    expect(g.nodes.find((n) => n.id === 'web2')?.name).toBe('Web server 2')
    expect(g.nodes.find((n) => n.id === 'db')?.locked).toBe(true)
    expect(g.edges.map((e) => e.id).sort()).toEqual(
      ['users->lb1', 'lb1->web1', 'lb1->web2', 'web1->cache1', 'web2->cache1', 'web1->db', 'web2->db'].sort(),
    )
    const xs = new Set(g.nodes.map((n) => n.x))
    expect(xs.size).toBe(4)
  })

  it('lets an item name its own feeders', () => {
    const g = board('users', 'lb', [{ type: 'web' }, { type: 'cache', id: 'edge', from: ['lb1'] }], 'db')
    expect(g.edges.map((e) => e.id)).toContain('lb1->edge')
    expect(g.edges.map((e) => e.id)).not.toContain('edge->db1')
    expect(node('db').name).toBe('Database 1')
  })
})

describe('every level', () => {
  it('is ordered by id, valid, and offers the previous tools plus its unlocks', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([0, 1, 2, 3])
    LEVELS.forEach((level, i) => {
      expect(validate(level.start, level)).toEqual([])
      for (const t of level.introduces ?? []) expect(level.palette).toContain(t)
      if (i > 0) for (const t of LEVELS[i - 1].palette) expect(level.palette).toContain(t)
      for (const id of Object.keys(level.carryOver?.wireFrom ?? {})) {
        expect(level.carryOver?.add.map((n) => n.id)).toContain(id)
      }
      if (level.traffic) expect(level.traffic.public + level.traffic.private + level.traffic.write).toBeCloseTo(1, 10)
      expect(level.stars.three).toBeGreaterThan(level.stars.two)
      expect(level.stars.two).toBeGreaterThan(0)
    })
  })

  it.each(LEVELS.map((l) => [l.id, l] as const))('level %i: the start board fails', (_, level) => {
    expect(score(level.start, level)).toBeNull()
  })

  it.each(LEVELS.map((l) => [l.id, l] as const))('level %i: every solution passes within budget, one with three stars', (_, level) => {
    expect(level.solutions.length).toBeGreaterThan(0)
    let best = 0
    for (const g of level.solutions) {
      expect(validate(g, level)).toEqual([])
      expect(costOf(g)).toBeLessThanOrEqual(level.budget)
      const s = score(g, level)
      expect(s).not.toBeNull()
      best = Math.max(best, s!.stars)
    }
    expect(best).toBe(3)
  })

  it.each(LEVELS.map((l) => [l.id, l] as const))('level %i: every trap fails', (_, level) => {
    for (const g of level.traps) {
      const blocked = validate(g, level).length > 0
      expect(blocked || score(g, level) === null).toBe(true)
    }
  })
})

describe('level 0', () => {
  it('starts on one small server that breaks at 300', () => {
    expect(breakingPoint(LEVELS[0].start, ALL_PUBLIC, 10_000)).toEqual({ qps: 300, nodeId: 'web1' })
  })
})
