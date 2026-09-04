/**
 * Enumerate the designs the board builder can make for a level and print the
 * ones that pass, best score first. Helps place star thresholds and spot
 * accidental easy wins.
 *
 *   pnpm explore 3
 */
import { LEVELS } from '../src/levels'
import { DATABASE, board, type TierItem } from '../src/levels/build'
import { costOf } from '../src/sim/catalogue'
import { evaluate } from '../src/sim/engine'
import { score } from '../src/sim/score'
import { validate } from '../src/sim/validate'
import type { Graph, Level } from '../src/sim/types'

const id = Number(process.argv[2] ?? 0)
const level = LEVELS.find((l) => l.id === id)
if (!level) {
  console.error(`No level ${id}. Levels: ${LEVELS.map((l) => l.id).join(', ')}`)
  process.exit(1)
}

interface Design {
  small: number
  large: number
  lb: boolean
  appCache: boolean
  edge: boolean
}

function build(level: Level, d: Design): Graph {
  const servers: TierItem[] = []
  if (d.small) servers.push({ type: 'web', count: d.small })
  if (d.large) servers.push({ type: 'bigweb', count: d.large })
  const hasDb = level.start.nodes.some((n) => n.type === 'db')
  const tail: TierItem[] = []
  if (d.appCache) tail.push({ type: 'cache' })
  if (hasDb) tail.push(DATABASE)
  const tiers: Parameters<typeof board> = ['users']
  if (d.lb) {
    tiers.push('lb')
    tiers.push(d.edge ? [...servers, { type: 'cache', id: 'edge', name: 'Edge cache', from: ['lb1'] }] : servers)
  } else {
    tiers.push(servers)
  }
  if (tail.length) tiers.push(tail)
  return board(...tiers)
}

const palette = new Set(level.palette)
const rows: Array<{ total: number; line: string }> = []
for (const lb of palette.has('lb') ? [false, true] : [false])
  for (const appCache of palette.has('cache') ? [false, true] : [false])
    for (const edge of palette.has('cache') && lb ? [false, true] : [false])
      for (let small = 0; small <= 14; small++)
        for (let large = 0; large <= 8; large++) {
          if (small + large === 0) continue
          if (!lb && small + large > 1) continue // users only know one address
          const design = { small, large, lb, appCache, edge }
          const g = build(level, design)
          if (validate(g, level).length) continue
          const s = score(g, level)
          if (!s) continue
          const r = evaluate(g, level.targetQps, level.traffic)
          const web = Math.max(...g.nodes.filter((n) => n.type === 'web' || n.type === 'bigweb').map((n) => r[n.id].util))
          const db = r.db ? ` db=${Math.round(r.db.util * 100)}%` : ''
          const shape = [lb ? 'lb' : '', small ? `${small} small` : '', large ? `${large} large` : '', appCache ? 'app cache' : '', edge ? 'edge cache' : '']
            .filter(Boolean)
            .join(' + ')
          rows.push({
            total: s.total,
            line: `${String(s.total).padStart(4)}  ${'★'.repeat(s.stars)}${'☆'.repeat(3 - s.stars)}  $${costOf(g)}  ${shape}  (web ${Math.round(web * 100)}%${db}, spare ${s.headroom}, left $${s.budgetLeft}, bonus ${s.bonus})`,
          })
        }

rows.sort((a, b) => b.total - a.total)
console.log(`Level ${level.id}: ${level.title}  target ${level.targetQps} QPS, budget $${level.budget}, stars ${level.stars.three}/${level.stars.two}`)
console.log(rows.length ? rows.map((r) => r.line).join('\n') : '(no passing designs)')
