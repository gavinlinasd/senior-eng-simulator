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
  const r = results[id] ?? { load: 0, public: 0, private: 0, write: 0, util: 0 }
  const isUsers = data.simType === 'users'
  const status = isUsers ? 'users' : statusOf(r.util)
  const className = [
    'sim-node',
    `sim-node--${data.simType}`,
    failedNodeId === id ? 'is-failed' : '',
    data.locked ? 'is-locked' : '',
  ].join(' ')
  const isCache = spec.hitCurve !== undefined
  const classes = showClasses ? (
    <div className="sim-node__classes">
      {isCache ? (
        <>
          hit pub {pct(r.hitRates?.public ?? 0)}% · priv {pct(r.hitRates?.private ?? 0)}%
        </>
      ) : (
        <>
          {fmt(r.public)} pub · {fmt(r.private)} priv · {fmt(r.write)} wr
        </>
      )}
    </div>
  ) : null
  // A cache shows its hit rate where other components show CPU.
  const hit = r.hitRate ?? 0
  const meterValue = isCache ? hit : Math.min(1, r.util)
  const meterLit = Math.round(meterValue * SEGMENTS)

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
              {fmt(r.load)} / {fmt(spec.capacity)} {isCache ? 'lookups' : 'QPS'}
            </div>
            <div
              className={isCache ? 'cpu cpu--hit' : 'cpu'}
              role="meter"
              aria-label={isCache ? 'Cache hit rate' : 'CPU load'}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct(meterValue)}
            >
              <span className="cpu__label">{isCache ? 'HIT' : 'CPU'}</span>
              <div className="cpu__segments" aria-hidden>
                {Array.from({ length: SEGMENTS }, (_, i) => (
                  <span key={i} className={i < meterLit ? 'is-lit' : undefined} />
                ))}
              </div>
              <span className="sim-node__pct">{isCache && r.load === 0 ? '—' : `${pct(meterValue)}%`}</span>
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
