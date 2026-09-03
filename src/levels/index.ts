import type { Level } from '../sim/types'
import { level0 } from './level0'
import { level1 } from './level1'

/** Play order. */
export const LEVELS: Level[] = [level0, level1]
