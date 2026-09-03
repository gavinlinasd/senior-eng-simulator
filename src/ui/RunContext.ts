import { createContext, useContext } from 'react'
import type { Evaluation } from '../sim/types'

export type Phase = 'idle' | 'running' | 'failed' | 'passed'

export interface RunState {
  phase: Phase
  qps: number
  results: Evaluation
  failedNodeId: string | null
}

/** Per-frame run state. Nodes and edges read their own numbers from here. */
export const RunContext = createContext<RunState>({ phase: 'idle', qps: 0, results: {}, failedNodeId: null })

export function useRunState() {
  return useContext(RunContext)
}
