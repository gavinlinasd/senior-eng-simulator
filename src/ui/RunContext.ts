import { createContext, useContext } from 'react'
import type { Evaluation, TrafficClass } from '../sim/types'

export type Phase = 'idle' | 'running' | 'failed' | 'passed'

export interface RunState {
  phase: Phase
  qps: number
  results: Evaluation
  failedNodeId: string | null
  /** Show the traffic classes separately (the level has more than one). */
  showClasses: boolean
  /** The classes present in the level's mix, in display order. */
  classes: TrafficClass[]
}

/** Per-frame run state. Nodes and edges read their own numbers from here. */
export const RunContext = createContext<RunState>({ phase: 'idle', qps: 0, results: {}, failedNodeId: null, showClasses: false, classes: [] })

export function useRunState() {
  return useContext(RunContext)
}
