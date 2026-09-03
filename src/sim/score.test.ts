import { describe, expect, it } from 'vitest'
import { computeShares } from './engine'
import { score } from './score'
import { behindLb, chain, repeat } from './fixtures'
import { level1 } from '../levels/level1'

const scoreOf = (g: ReturnType<typeof chain>) => score(g, computeShares(g), level1)

describe('score', () => {
  it('is null for a failing design', () => {
    expect(scoreOf(level1.start)).toBeNull()
    expect(scoreOf(chain('bigweb'))).toBeNull()
  })

  it('LB + 4 web servers: 100 + 17 headroom + 50 budget, no bonus', () => {
    expect(scoreOf(behindLb(...repeat('web', 4)))).toMatchObject({
      base: 100,
      headroom: 17,
      budgetLeft: 50,
      bonus: 0,
      total: 167,
    })
  })

  it('LB + 5 web servers: 100 + 33 headroom + 0 budget + 50 bonus', () => {
    expect(scoreOf(behindLb(...repeat('web', 5)))).toMatchObject({
      base: 100,
      headroom: 33,
      budgetLeft: 0,
      bonus: 50,
      total: 183,
    })
  })

  it('LB + 2 large servers: 100 + 17 headroom + 10 budget, no bonus', () => {
    expect(scoreOf(behindLb('bigweb', 'bigweb'))).toMatchObject({
      base: 100,
      headroom: 17,
      budgetLeft: 10,
      bonus: 0,
      total: 127,
    })
  })
})
