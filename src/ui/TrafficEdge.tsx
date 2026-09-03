import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { fmt } from './format'
import { useRunState } from './RunContext'

/** Dashed edge that flows faster with more load and shows the QPS on it during a run. */
export default function TrafficEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  target,
  markerEnd,
}: EdgeProps) {
  const { qps, results, phase } = useRunState()
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const load = results[target]?.load ?? 0
  const active = qps > 0
  const flowing = phase === 'running' || phase === 'passed'
  const duration = Math.max(0.2, 1.2 - Math.min(1, load / 800))
  const className = ['traffic-edge', active ? 'is-active' : '', flowing ? 'is-flowing' : ''].join(' ')

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} className={className} style={{ animationDuration: `${duration}s` }} />
      {active && (
        <EdgeLabelRenderer>
          <div
            className="traffic-edge__label nodrag nopan"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {fmt(load)} QPS
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
