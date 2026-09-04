import { sequence } from './build'
import { level0 } from './level0'
import { level1 } from './level1'
import { level2 } from './level2'
import { level3 } from './level3'

/** Play order. Palettes accumulate: each level offers the previous tools plus its own unlocks. */
export const LEVELS = sequence([level0, level1, level2, level3])
