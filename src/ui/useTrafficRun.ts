import { useCallback, useEffect, useRef, useState } from 'react'
import { passes } from '../sim/engine'
import type { BreakingPoint, Level } from '../sim/types'
import type { Phase } from './RunContext'

export type Outcome = 'failed' | 'passed'

/**
 * Ramps QPS linearly from 0 to the target over level.rampMs. Because the model
 * is linear the outcome is known up front: if the breaking point is at or
 * below the target, the ramp freezes there and the run fails.
 */
export function useTrafficRun(level: Level, bp: BreakingPoint | null, onOutcome?: (outcome: Outcome) => void) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [qps, setQps] = useState(0)
  const [failedNodeId, setFailedNodeId] = useState<string | null>(null)
  /** Increments on every play, so the UI can tell one run's outcome from the next. */
  const [runId, setRunId] = useState(0)
  const raf = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current)
    raf.current = null
  }, [])

  const play = useCallback(() => {
    stop()
    setPhase('running')
    setFailedNodeId(null)
    setRunId((id) => id + 1)
    const t0 = performance.now()
    const failAt = bp && !passes(bp, level.targetQps) ? bp : null
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / level.rampMs)
      const q = level.targetQps * t
      if (failAt && q >= failAt.qps) {
        setQps(failAt.qps)
        setFailedNodeId(failAt.nodeId)
        setPhase('failed')
        onOutcome?.('failed')
        return
      }
      setQps(q)
      if (t >= 1) {
        setPhase('passed')
        onOutcome?.('passed')
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [bp, level, stop, onOutcome])

  const reset = useCallback(() => {
    stop()
    setQps(0)
    setPhase('idle')
    setFailedNodeId(null)
  }, [stop])

  useEffect(() => stop, [stop])

  return { phase, qps, failedNodeId, runId, play, reset }
}
