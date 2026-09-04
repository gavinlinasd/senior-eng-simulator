import { describe, expect, it } from 'vitest'
import { carryInto } from './carry'
import { breakingPoint } from './engine'
import { validate } from './validate'
import { behindLb, repeat } from './fixtures'
import { level1 } from '../levels/level1'
import { level2 } from '../levels/level2'

describe('carryInto', () => {
  it('keeps the board unchanged for a level without carry-over rules', () => {
    const board = behindLb(...repeat('web', 4))
    expect(carryInto(board, level1)).toEqual(board)
  })

  it('adds the level 2 database to the right and wires every web server into it', () => {
    const board = behindLb('web', 'web', 'bigweb')
    const g = carryInto(board, level2)
    const db = g.nodes.find((n) => n.type === 'db')!
    expect(db.locked).toBe(true)
    expect(db.x).toBeGreaterThan(Math.max(...board.nodes.map((n) => n.x)))
    expect(g.edges.filter((e) => e.to === db.id).map((e) => e.from).sort()).toEqual(['bigweb1', 'web1', 'web2'])
    expect(validate(g, level2)).toEqual([])
    expect(breakingPoint(g, level2.traffic!, level2.targetQps)).toEqual({ qps: 500, nodeId: db.id })
  })

  it('does not mutate the board it was given', () => {
    const board = behindLb('web')
    const before = JSON.stringify(board)
    carryInto(board, level2)
    expect(JSON.stringify(board)).toBe(before)
  })
})
