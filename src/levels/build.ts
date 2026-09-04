import { CATALOGUE } from '../sim/catalogue'
import type { Graph, Level, NodeType, SimEdge, SimNode } from '../sim/types'

/**
 * Level authoring kit. A board is described as columns, left to right; each
 * column holds one or more items stacked vertically. Every non-sink node in a
 * column is wired to every node in the next column, unless an item names its
 * own feeders with `from`. Ids are `${type}${n}` counted per type across the
 * board, names `${label} ${n}`; users is always `users`.
 */

export interface TierItem {
  type: NodeType
  count?: number
  id?: string
  name?: string
  locked?: boolean
  /** Wire only from these ids instead of from the previous column. */
  from?: string[]
}

export type Tier = NodeType | TierItem | Array<NodeType | TierItem>

/** The one managed database that levels 2+ put on the board. */
export const DATABASE: TierItem = { type: 'db', id: 'db', name: 'Database', locked: true }

const COLUMN_X = [80, 380, 700, 1020, 1340]
const ROW_GAP = 110
const TOP = 40
const MIN_CENTER = 200

const asItems = (tier: Tier): TierItem[] =>
  (Array.isArray(tier) ? tier : [tier]).map((t) => (typeof t === 'string' ? { type: t } : t))

/** A single node from a tier item, positioned by the builder (or at the origin). */
export function node(item: TierItem | NodeType, seq = 1, x = 0, y = 0): SimNode {
  const it = typeof item === 'string' ? { type: item } : item
  const spec = CATALOGUE[it.type]
  const isUsers = it.type === 'users'
  return {
    id: it.id ?? (isUsers ? 'users' : `${it.type}${seq}`),
    type: it.type,
    name: it.name ?? (isUsers ? 'Users' : `${spec.label} ${seq}`),
    x,
    y,
    ...(it.locked ? { locked: true } : {}),
  }
}

export function board(...tiers: Tier[]): Graph {
  const counts: Partial<Record<NodeType, number>> = {}
  const columns: Array<Array<{ node: SimNode; item: TierItem }>> = []
  for (const tier of tiers) {
    const column: Array<{ node: SimNode; item: TierItem }> = []
    for (const item of asItems(tier)) {
      for (let i = 0; i < (item.count ?? 1); i++) {
        const seq = (counts[item.type] = (counts[item.type] ?? 0) + 1)
        column.push({ node: node(item, seq), item })
      }
    }
    columns.push(column)
  }

  const tallest = Math.max(...columns.map((c) => c.length))
  const centerY = Math.max(MIN_CENTER, TOP + ((tallest - 1) * ROW_GAP) / 2)
  const nodes: SimNode[] = []
  const edges: SimEdge[] = []
  columns.forEach((column, c) => {
    const x = COLUMN_X[c] ?? COLUMN_X[COLUMN_X.length - 1] + (c - COLUMN_X.length + 1) * 320
    const top = centerY - ((column.length - 1) * ROW_GAP) / 2
    column.forEach((entry, r) => {
      entry.node.x = x
      entry.node.y = top + r * ROW_GAP
      nodes.push(entry.node)
      const feeders = entry.item.from ?? (c > 0 ? columns[c - 1].filter((p) => !CATALOGUE[p.node.type].sink).map((p) => p.node.id) : [])
      for (const from of feeders) edges.push({ id: `${from}->${entry.node.id}`, from, to: entry.node.id })
    })
  })
  return { nodes, edges }
}

/** Fields a level file must give; the rest get defaults from `defineLevel`. */
export type LevelSpec = Omit<Level, 'rampMs' | 'palette' | 'carryOver'> & {
  rampMs?: number
  /** Defaults to the previous level's palette plus this level's unlocks (see `sequence`). */
  palette?: NodeType[]
  carryOver?: { add: Array<TierItem | NodeType>; wireFrom: Record<string, NodeType[]> }
  /** Boards that pass this level, at least one of them with three stars. Checked by the level contract test. */
  solutions?: Graph[]
  /** Boards that look plausible and fail. Checked by the level contract test. */
  traps?: Graph[]
}

export type AuthoredLevel = Level & { solutions: Graph[]; traps: Graph[] }

const DEFAULT_RAMP_MS = 5000

export function defineLevel(spec: LevelSpec): AuthoredLevel {
  const { carryOver, solutions = [], traps = [], palette = [], rampMs = DEFAULT_RAMP_MS, ...rest } = spec
  return {
    ...rest,
    rampMs,
    palette,
    ...(carryOver ? { carryOver: { add: carryOver.add.map((a) => node(a)), wireFrom: carryOver.wireFrom } } : {}),
    solutions,
    traps,
  }
}

const CATALOGUE_ORDER = Object.keys(CATALOGUE) as NodeType[]

/**
 * Play order. A level without a palette inherits the previous one's plus its
 * own unlocks, listed in catalogue order so the tray reads the same everywhere.
 */
export function sequence(levels: AuthoredLevel[]): AuthoredLevel[] {
  let palette: NodeType[] = []
  return levels.map((level) => {
    const next = level.palette.length ? level.palette : [...palette, ...(level.introduces ?? [])]
    palette = CATALOGUE_ORDER.filter((t) => next.includes(t))
    return { ...level, palette }
  })
}
