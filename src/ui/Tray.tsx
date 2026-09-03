import type { DragEvent, KeyboardEvent } from 'react'
import { CATALOGUE } from '../sim/catalogue'
import type { NodeType } from '../sim/types'
import { DRAG_MIME } from './flow'
import { fmt } from './format'
import { ICONS } from './icons'

interface TrayProps {
  palette: NodeType[]
  onAdd: (type: NodeType) => void
}

export function Tray({ palette, onAdd }: TrayProps) {
  return (
    <footer className="tray">
      <div className="tray__hint">
        Drag a component onto the board, or click it to add. Wire components by dragging from a right-hand port to a
        left-hand port.
      </div>
      <div className="tray__items">
        {palette.map((type) => {
          const spec = CATALOGUE[type]
          const Icon = ICONS[type]
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
              className="tray__item"
              role="button"
              tabIndex={0}
              draggable
              onDragStart={onDragStart}
              onClick={() => onAdd(type)}
              onKeyDown={onKeyDown}
            >
              <div className="tray__icon">
                <Icon size={24} aria-hidden />
              </div>
              <div>
                <div className="tray__label">{spec.label}</div>
                <div className="tray__meta">
                  {fmt(spec.capacity)} QPS · ${spec.cost}
                </div>
                <div className="tray__blurb">{spec.blurb}</div>
              </div>
            </div>
          )
        })}
      </div>
    </footer>
  )
}
