import type { DragEvent, KeyboardEvent } from 'react'
import { Cloud } from 'lucide-react'
import { CATALOGUE } from '../sim/catalogue'
import type { NodeType } from '../sim/types'
import { DRAG_MIME } from './flow'
import { fmt } from './format'
import { HitCurveChart } from './HitCurveChart'
import { ICONS } from './icons'
import { RichText } from './RichText'

interface TrayProps {
  palette: NodeType[]
  /** Types unlocked by the current level, shown with a "New" badge. */
  introduces: NodeType[]
  onAdd: (type: NodeType) => void
}

/** The component tray, styled as the cloud provider's catalogue. */
export function Tray({ palette, introduces, onAdd }: TrayProps) {
  return (
    <footer className="tray">
      <div className="tray__header">
        <span className="tray__brand">
          <Cloud size={16} aria-hidden /> Bmazon Web Service
        </span>
        <span>Your cloud provider. Everything you can rent, with its max QPS and price.</span>
        <span className="tray__hint">Drag onto the board or click to add. Wire from a right-hand port to a left-hand port.</span>
      </div>
      <div className="tray__items">
        {palette.map((type) => {
          const spec = CATALOGUE[type]
          const Icon = ICONS[type]
          const isNew = introduces.includes(type)
          const onDragStart = (e: DragEvent) => {
            e.dataTransfer.setData(DRAG_MIME, type)
            e.dataTransfer.effectAllowed = 'move'
          }
          const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onAdd(type)
            }
          }
          return (
            <div
              key={type}
              className={isNew ? 'tray__item is-new' : 'tray__item'}
              role="button"
              tabIndex={0}
              draggable
              onDragStart={onDragStart}
              onClick={() => onAdd(type)}
              onKeyDown={onKeyDown}
            >
              {isNew && <span className="tray__badge">New</span>}
              <div className="tray__icon">
                <Icon size={24} aria-hidden />
              </div>
              <div>
                <div className="tray__label">{spec.label}</div>
                <div className="tray__meta">
                  Max {fmt(spec.capacity)} QPS · ${spec.cost}
                </div>
                <div className="tray__blurb">
                  <RichText text={spec.blurb} />
                </div>
                {spec.hitCurve && <HitCurveChart curve={spec.hitCurve} />}
              </div>
            </div>
          )
        })}
      </div>
    </footer>
  )
}
