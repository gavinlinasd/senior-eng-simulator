import { describe, expect, it } from 'vitest'
import { computeShares } from './engine'
import { score } from './score'
import { behindLb, chain, edge, node, repeat } from './fixtures'
import { level1 } from '../levels/level1'
import { level2 } from '../levels/level2'

const scoreOf = (g: ReturnType<typeof chain>) => score(g, computeShares(g), level1)

describe('score', () => {
  it('is null for a failing design', () => {
    expect(scoreOf(level1.start)).toBeNull()
    expect(scoreOf(chain('bigweb'))).toBeNull()
  })

  it('LB + 4 web servers: four servers with 17% spare each, $50 left, no bonus', () => {
    expect(scoreOf(behindLb(...repeat('web', 4)))).toMatchObject({
      base: 100,
      headroom: 67,
      budgetLeft: 50,
      bonus: 0,
      total: 217,
    })
  })

  it('LB + 5 web servers: five servers with 33% spare each, nothing left, green bonus', () => {
    expect(scoreOf(behindLb(...repeat('web', 5)))).toMatchObject({
      base: 100,
      headroom: 167,
      budgetLeft: 0,
      bonus: 50,
      total: 317,
    })
  })

  it('LB + 2 large servers: two servers with 17% spare each, $10 left, no bonus', () => {
    expect(scoreOf(behindLb('bigweb', 'bigweb'))).toMatchObject({
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
    const s = score(g, computeShares(g, level2.traffic), level2)!
    // six servers at 83.3% (16.7 spare each) plus the database at 70.5% (29.5 spare)
    expect(s.headroom).toBe(130)
    expect(s.budgetLeft).toBe(100)
    expect(s.total).toBe(330)
  })
})
