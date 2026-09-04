import { describe, expect, it } from 'vitest'
import { score, starsFor, nextStarFor } from './score'
import { behindLb, chain, edge, node, repeat } from './fixtures'
import { level1 } from '../levels/level1'
import { level2 } from '../levels/level2'

describe('stars', () => {
  it('three at the top threshold, two at the next, one for any other pass', () => {
    const { three, two } = level1.stars
    expect(starsFor(level1, three)).toBe(3)
    expect(starsFor(level1, three - 1)).toBe(2)
    expect(starsFor(level1, two)).toBe(2)
    expect(starsFor(level1, two - 1)).toBe(1)
    expect(nextStarFor(level1, two - 1)).toBe(two)
    expect(nextStarFor(level1, two)).toBe(three)
    expect(nextStarFor(level1, three)).toBeNull()
  })

  it('is part of the score', () => {
    const s = score(behindLb(...repeat('web', 4)), level1)!
    expect(s.stars).toBe(starsFor(level1, s.total))
    expect(s.nextStarAt).toBe(nextStarFor(level1, s.total))
  })
})

describe('score', () => {
  it('is null for a failing design', () => {
    expect(score(level1.start, level1)).toBeNull()
    expect(score(chain('bigweb'), level1)).toBeNull()
  })

  it('LB + 4 web servers: four servers with 17% spare each, $40 left, no bonus', () => {
    expect(score(behindLb(...repeat('web', 4)), level1)).toMatchObject({
      base: 100,
      headroom: 67,
      budgetLeft: 40,
      bonus: 0,
      total: 207,
    })
  })

  it('LB + 2 large servers: two servers with 17% spare each, nothing left, no bonus', () => {
    expect(score(behindLb('bigweb', 'bigweb'), level1)).toMatchObject({
      base: 100,
      headroom: 33,
      budgetLeft: 0,
      bonus: 0,
      total: 133,
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
