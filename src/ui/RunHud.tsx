import { Panel } from '@xyflow/react'
import { Play, RotateCcw, Square } from 'lucide-react'
import type { ClassLoad } from '../sim/types'
import { classLabel, classesIn } from './classes'
import { fmt, pct } from './format'
import type { Phase } from './RunContext'

interface RunHudProps {
  phase: Phase
  qps: number
  targetQps: number
  /** Traffic mix, shown when the level has private reads or writes. */
  traffic?: ClassLoad
  blocked: boolean
  onPlay: () => void
  onStop: () => void
}

/** Play/stop controls plus a ramp meter, floating over the board. */
export function RunHud({ phase, qps, targetQps, traffic, blocked, onPlay, onStop }: RunHudProps) {
  const running = phase === 'running'
  return (
    <Panel position="top-left" className="hud">
      <div className="hud__buttons">
        <button
          className="hud__play"
          onClick={onPlay}
          disabled={blocked || running}
          title={blocked ? 'Fix the issues in the level panel first' : undefined}
        >
          {phase === 'idle' ? (
            <>
              <Play size={16} aria-hidden /> Send traffic
            </>
          ) : running ? (
            'Ramping…'
          ) : (
            <>
              <RotateCcw size={16} aria-hidden /> Run again
            </>
          )}
        </button>
        {phase !== 'idle' && (
          <button className="hud__stop" onClick={onStop}>
            <Square size={14} aria-hidden /> Stop
          </button>
        )}
      </div>
      <div className="hud__meter" role="progressbar" aria-valuemin={0} aria-valuemax={targetQps} aria-valuenow={Math.round(qps)}>
        <div className="hud__meter-fill" data-phase={phase} style={{ width: `${(qps / targetQps) * 100}%` }} />
      </div>
      <div className="hud__qps">
        {fmt(qps)} / {fmt(targetQps)} QPS
      </div>
      {traffic && classesIn(traffic).length > 1 && (
        <table className="hud__mix">
          <tbody>
            {classesIn(traffic).map((c, _, all) => (
              <tr key={c}>
                <td>{classLabel(c, all)}</td>
                <td>{pct(traffic[c])}%</td>
                <td>{fmt(qps * traffic[c])} QPS</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}
