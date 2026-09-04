import type { Level } from '../sim/types'
import { level0 } from './level0'
import { level1 } from './level1'
import { level2 } from './level2'
import { level3 } from './level3'

/** Play order. */
export const LEVELS: Level[] = [level0, level1, level2, level3]
