import type { ClassLoad, TrafficClass } from '../sim/types'
import { fmt } from './format'

export const CLASS_SHORT: Record<TrafficClass, string> = { public: 'pub', private: 'priv', write: 'wr' }
export const CLASS_LABEL: Record<TrafficClass, string> = { public: 'Public reads', private: 'Private reads', write: 'Writes' }
const ORDER: TrafficClass[] = ['public', 'private', 'write']

/** The classes a mix actually contains, in display order. */
export function classesIn(traffic: ClassLoad | undefined): TrafficClass[] {
  if (!traffic) return []
  return ORDER.filter((c) => traffic[c] > 0)
}

/** "300 pub · 700 priv · 100 wr" for the classes given. */
export function classLine(load: ClassLoad, classes: TrafficClass[]): string {
  return classes.map((c) => `${fmt(load[c])} ${CLASS_SHORT[c]}`).join(' · ')
}
