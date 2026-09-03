import { memo } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { Lock, X } from 'lucide-react'
import { CATALOGUE } from '../sim/catalogue'
import { statusOf } from '../sim/engine'
import type { FlowNode } from './flow'
import { fmt, pct } from './format'
import { ICONS } from './icons'
import { useRunState } from './RunContext'

const SEGMENTS = 10

function SimNodeCard({ id, data }: NodeProps<FlowNode>) {
  const { qps, results, failedNodeId, showClasses } = useRunState()
  const { deleteElements } = useReactFlow()
  const spec = CATALOGUE[data.simType]
  const Icon = ICONS[data.simType]
  const r = results[id] ?? { load: 0, read: 0, write: 0, util: 0 }
  const isUsers = data.simType === 'users'
  const status = isUsers ? 'users' : statusOf(r.util)
  const lit = Math.round(Math.min(1, r.util) * SEGMENTS)
  const className = [
    'sim-node',
    `sim-node--${data.simType}`,
    failedNodeId === id ? 'is-failed' : '',
    data.locked ? 'is-locked' : '',
  ].join(' ')
  const classes = showClasses ? (
    <div className="sim-node__classes">
      {fmt(r.read)} R · {fmt(r.write)} W
    </div>
  ) : null

  return (
    <div className={className} data-status={status}>
      {!isUsers && <Handle type="target" position={Position.Left} />}
      {!isUsers && !data.locked && (
        <button
          className="sim-node__delete nodrag nopan"
          aria-label={`Remove ${data.name}`}
          title="Remove"
          onClick={(e) => {
            e.stopPropagation()
            void deleteElements({ nodes: [{ id }] })
          }}
        >
          <X size={12} aria-hidden />
        </button>
      )}
      <div className="sim-node__icon">
        <Icon size={22} aria-hidden />
      </div>
      <div className="sim-node__body">
        <div className="sim-node__name">
          {data.name}
          {data.locked && <Lock size={11} className="sim-node__lock" aria-label="Locked" />}
        </div>
        {isUsers ? (
          <>
            <div className="sim-node__qps">
              {fmt(qps)} <span>QPS</span>
            </div>
            {classes}
          </>
        ) : (
          <>
            <div className="sim-node__row">
              {fmt(r.load)} / {fmt(spec.capacity)} QPS
            </div>
            <div className="cpu" role="meter" aria-label="CPU load" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct(r.util)}>
              <span className="cpu__label">CPU</span>
              <div className="cpu__segments" aria-hidden>
                {Array.from({ length: SEGMENTS }, (_, i) => (
                  <span key={i} className={i < lit ? 'is-lit' : undefined} />
                ))}
              </div>
              <span className="sim-node__pct">{pct(r.util)}%</span>
            </div>
            {classes}
          </>
        )}
      </div>
      {!spec.sink && <Handle type="source" position={Position.Right} />}
    </div>
  )
}

export default memo(SimNodeCard)
