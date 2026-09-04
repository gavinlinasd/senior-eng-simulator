import type { ClassLoad, TrafficClass } from '../sim/types'
import { fmt } from './format'

const ORDER: TrafficClass[] = ['public', 'private', 'write']

/** The classes a mix actually contains, in display order. */
export function classesIn(traffic: ClassLoad | undefined): TrafficClass[] {
  if (!traffic) return []
  return ORDER.filter((c) => traffic[c] > 0)
}

/**
 * Labels depend on what else is present: "private reads" only means something
 * next to public ones, so alone it is just "reads".
 */
export function classLabel(c: TrafficClass, classes: TrafficClass[]): string {
  if (c === 'write') return 'Writes'
  if (c === 'public') return 'Public reads'
  return classes.includes('public') ? 'Private reads' : 'Reads'
}

export function classShort(c: TrafficClass, classes: TrafficClass[]): string {
  if (c === 'write') return 'wr'
  if (c === 'public') return 'pub'
  return classes.includes('public') ? 'priv' : 'rd'
}

/** "300 pub · 700 priv · 100 wr" for the classes given. */
export function classLine(load: ClassLoad, classes: TrafficClass[]): string {
  return classes.map((c) => `${fmt(load[c])} ${classShort(c, classes)}`).join(' · ')
}
