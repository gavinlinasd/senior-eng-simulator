import type { Graph, Level, SimNode } from './types'

const COLUMN_GAP = 280
const ROW_GAP = 110

/**
 * The board a player passed one level with, turned into the next level's
 * start: the level's additions are placed to the right of the existing board
 * and wired from the node types the level names. Positions of existing nodes
 * are kept so it feels like the same system being patched.
 */
export function carryInto(board: Graph, level: Level): Graph {
  const carry = level.carryOver
  if (!carry) return board
  const nodes: SimNode[] = board.nodes.map((n) => ({ ...n }))
  const edges = board.edges.map((e) => ({ ...e }))

  const rightmost = Math.max(...nodes.map((n) => n.x), 0)
  carry.add.forEach((added, i) => {
    const feeders = nodes.filter((n) => (carry.wireFrom[added.id] ?? []).includes(n.type))
    const y = feeders.length ? feeders.reduce((sum, n) => sum + n.y, 0) / feeders.length : 200
    nodes.push({ ...added, x: rightmost + COLUMN_GAP, y: y + i * ROW_GAP })
    for (const f of feeders) edges.push({ id: `${f.id}->${added.id}`, from: f.id, to: added.id })
  })
  return { nodes, edges }
}
