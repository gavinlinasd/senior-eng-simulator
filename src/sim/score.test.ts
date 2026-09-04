import { describe, expect, it } from 'vitest'
import { score, starsFor, nextStarFor } from './score'
import { behindLb, chain, edge, node, repeat } from './fixtures'
import { level1 } from '../levels/level1'
import { level2 } from '../levels/level2'

describe('stars', () => {
  it('three at the top threshold, two at the next, one for any other pass', () => {
    expect(starsFor(level1, 317)).toBe(3)
    expect(starsFor(level1, 300)).toBe(3)
    expect(starsFor(level1, 299)).toBe(2)
    expect(starsFor(level1, 200)).toBe(2)
    expect(starsFor(level1, 143)).toBe(1)
    expect(nextStarFor(level1, 143)).toBe(200)
    expect(nextStarFor(level1, 217)).toBe(300)
    expect(nextStarFor(level1, 317)).toBeNull()
  })

  it('is part of the score', () => {
    expect(score(behindLb(...repeat('web', 5)), level1)).toMatchObject({ stars: 3, nextStarAt: null })
    expect(score(behindLb(...repeat('web', 4)), level1)).toMatchObject({ stars: 2, nextStarAt: 300 })
    expect(score(behindLb('bigweb', 'bigweb'), level1)).toMatchObject({ stars: 1, nextStarAt: 200 })
  })
})

describe('score', () => {
  it('is null for a failing design', () => {
    expect(score(level1.start, level1)).toBeNull()
    expect(score(chain('bigweb'), level1)).toBeNull()
  })

  it('LB + 4 web servers: four servers with 17% spare each, $50 left, no bonus', () => {
    expect(score(behindLb(...repeat('web', 4)), level1)).toMatchObject({
      base: 100,
      headroom: 67,
      budgetLeft: 50,
      bonus: 0,
      total: 217,
    })
  })

  it('LB + 5 web servers: five servers with 33% spare each, nothing left, green bonus', () => {
    expect(score(behindLb(...repeat('web', 5)), level1)).toMatchObject({
      base: 100,
      headroom: 167,
      budgetLeft: 0,
      bonus: 50,
      total: 317,
    })
  })

  it('LB + 2 large servers: two servers with 17% spare each, $10 left, no bonus', () => {
    expect(score(behindLb('bigweb', 'bigweb'), level1)).toMatchObject({
      base: 100,
      headroom: 33,
      budgetLeft: 10,
      bonus: 0,
      total: 143,
    })
  })

  it('the load balancer and cache never count toward headroom, the database does', () => {
    const g = behindLb(...repeat('web', 6))
    g.nodes.push(node('cache', 'cache1'), node('db', 'db1'))
    for (let i = 1; i <= 6; i++) g.edges.push(edge(`web${i}`, 'cache1'), edge(`web${i}`, 'db1'))
    const s = score(g, level2)!
    // six servers at 83.3% plus whatever the database has spare; nothing from the LB or cache
    expect(s.headroom).toBeGreaterThan(100)
    expect(s.headroom).toBeLessThan(200)
    expect(s.budgetLeft).toBe(100)
    expect(s.total).toBe(100 + s.headroom + 100 + s.bonus)
  })
})
