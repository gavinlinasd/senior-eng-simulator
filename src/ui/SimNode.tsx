import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATALOGUE } from '../sim/catalogue'
import { statusOf } from '../sim/engine'
import type { FlowNode } from './flow'
import { fmt, pct } from './format'
import { ICONS } from './icons'
import { useRunState } from './RunContext'

const SEGMENTS = 10

function SimNodeCard({ id, data }: NodeProps<FlowNode>) {
  const { qps, results, failedNodeId } = useRunState()
  const spec = CATALOGUE[data.simType]
  const Icon = ICONS[data.simType]
  const r = results[id] ?? { load: 0, util: 0 }
  const isUsers = data.simType === 'users'
  const status = isUsers ? 'users' : statusOf(r.util)
  const lit = Math.round(Math.min(1, r.util) * SEGMENTS)
  const className = ['sim-node', `sim-node--${data.simType}`, failedNodeId === id ? 'is-failed' : ''].join(' ')

  return (
    <div className={className} data-status={status}>
      {!isUsers && <Handle type="target" position={Position.Left} />}
      <div className="sim-node__icon">
        <Icon size={22} aria-hidden />
      </div>
      <div className="sim-node__body">
        <div className="sim-node__name">{data.name}</div>
        {isUsers ? (
          <div className="sim-node__qps">
            {fmt(qps)} <span>QPS</span>
          </div>
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
          </>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(SimNodeCard)
