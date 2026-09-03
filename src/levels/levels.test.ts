import { describe, expect, it } from 'vitest'
import { LEVELS } from './index'
import { level0 } from './level0'
import { breakingPoint, computeShares, passes, peakUtilization } from '../sim/engine'
import { validate } from '../sim/validate'
import { chain } from '../sim/fixtures'

describe('levels', () => {
  it('are ordered by id and every start graph is valid', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([0, 1, 2])
    for (const level of LEVELS) {
      expect(validate(level.start, level)).toEqual([])
      for (const t of level.introduces ?? []) expect(level.palette).toContain(t)
      for (const id of Object.keys(level.carryOver?.wireFrom ?? {})) {
        expect(level.carryOver?.add.map((n) => n.id)).toContain(id)
      }
      if (level.traffic) expect(level.traffic.read + level.traffic.write).toBeCloseTo(1, 10)
    }
  })

  it('level 0 starts on one small server that breaks at 300', () => {
    const g = level0.start
    expect(breakingPoint(g, computeShares(g))).toEqual({ qps: 300, nodeId: 'web1' })
  })

  it('level 0 passes with one large server at 83%', () => {
    const g = chain('bigweb')
    const shares = computeShares(g)
    expect(validate(g, level0)).toEqual([])
    expect(passes(breakingPoint(g, shares), level0.targetQps)).toBe(true)
    expect(peakUtilization(g, shares, level0.targetQps)).toBeCloseTo(0.8333, 3)
  })
})
