import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATALOGUE } from '../sim/catalogue'
import { statusOf } from '../sim/engine'
import type { FlowNode } from './flow'
import { fmt, pct } from './format'
import { ICONS } from './icons'
import { useRunState } from './RunContext'

function SimNodeCard({ id, data }: NodeProps<FlowNode>) {
  const { qps, results, failedNodeId } = useRunState()
  const spec = CATALOGUE[data.simType]
  const Icon = ICONS[data.simType]
  const r = results[id] ?? { load: 0, util: 0 }
  const isUsers = data.simType === 'users'
  const status = isUsers ? 'users' : statusOf(r.util)
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
              <span>
                {fmt(r.load)} / {fmt(spec.capacity)} QPS
              </span>
              <span className="sim-node__pct">{pct(r.util)}%</span>
            </div>
            <div className="sim-node__bar">
              <div className="sim-node__fill" style={{ width: `${Math.min(1, r.util) * 100}%` }} />
            </div>
          </>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(SimNodeCard)
