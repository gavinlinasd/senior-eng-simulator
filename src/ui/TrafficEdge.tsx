import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react'
import { X } from 'lucide-react'
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
  selected,
}: EdgeProps) {
  const { qps, results, phase, showClasses } = useRunState()
  const { deleteElements } = useReactFlow()
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const r = results[target] ?? { load: 0, read: 0, write: 0, util: 0 }
  const load = r.load
  const active = qps > 0
  const flowing = phase === 'running' || phase === 'passed'
  const duration = Math.max(0.2, 1.2 - Math.min(1, load / 800))
  const className = ['traffic-edge', active ? 'is-active' : '', flowing ? 'is-flowing' : ''].join(' ')

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} className={className} style={{ animationDuration: `${duration}s` }} />
      {(active || selected) && (
        <EdgeLabelRenderer>
          {active && (
            <div
              className="traffic-edge__label nodrag nopan"
              style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            >
              {fmt(load)} QPS
              {showClasses && (
                <small>
                  {fmt(r.read)} R · {fmt(r.write)} W
                </small>
              )}
            </div>
          )}
          {selected && (
            <button
              className="traffic-edge__delete nodrag nopan"
              aria-label="Remove wire"
              title="Remove wire"
              style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 20}px)` }}
              onClick={() => void deleteElements({ edges: [{ id }] })}
            >
              <X size={12} aria-hidden />
            </button>
          )}
        </EdgeLabelRenderer>
      )}
    </>
  )
}
