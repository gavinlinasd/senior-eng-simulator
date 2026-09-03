import { useLayoutEffect, useRef, useState } from 'react'
import type { IntroStep, TourTarget } from '../sim/types'
import { Modal } from './Modal'

const TARGETS: Record<TourTarget, string> = {
  board: '.board',
  tray: '.tray',
  panel: '.panel',
  hud: '.hud',
  new: '.tray__item.is-new',
}

const PAD = 8
const GAP = 14
const MARGIN = 16

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

function measure(target: TourTarget): Rect | null {
  const el = document.querySelector(TARGETS[target])
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left - PAD, top: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
}

/** Put the card below, above, left of, or right of the spotlight, whichever fits; else centre it on the target. */
function place(rect: Rect | null, card: { width: number; height: number }) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clampX = (x: number) => Math.min(Math.max(x, MARGIN), vw - card.width - MARGIN)
  const clampY = (y: number) => Math.min(Math.max(y, MARGIN), vh - card.height - MARGIN)
  if (!rect) return { left: (vw - card.width) / 2, top: (vh - card.height) / 2 }
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  if (rect.top + rect.height + GAP + card.height <= vh - MARGIN) {
    return { left: clampX(cx - card.width / 2), top: rect.top + rect.height + GAP }
  }
  if (rect.top - GAP - card.height >= MARGIN) {
    return { left: clampX(cx - card.width / 2), top: rect.top - GAP - card.height }
  }
  if (rect.left - GAP - card.width >= MARGIN) {
    return { left: rect.left - GAP - card.width, top: clampY(cy - card.height / 2) }
  }
  if (rect.left + rect.width + GAP + card.width <= vw - MARGIN) {
    return { left: rect.left + rect.width + GAP, top: clampY(cy - card.height / 2) }
  }
  return { left: clampX(cx - card.width / 2), top: clampY(cy - card.height / 2) }
}

interface TutorialProps {
  open: boolean
  steps: IntroStep[]
  onClose: () => void
}

/** Spotlight walkthrough. Steps are level data; this only knows how to point at parts of the UI. */
export function Tutorial({ open, steps, onClose }: TutorialProps) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [card, setCard] = useState({ width: 380, height: 200 })
  const cardRef = useRef<HTMLDivElement>(null)
  const step = steps[Math.min(index, steps.length - 1)]
  const last = index >= steps.length - 1

  const close = () => {
    setIndex(0)
    onClose()
  }

  const target = step.target
  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      setRect(target ? measure(target) : null)
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect()
        setCard((c) => (c.width === r.width && c.height === r.height ? c : { width: r.width, height: r.height }))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [open, index, target])

  const pos = place(rect, card)

  if (!step) return null

  return (
    <Modal open={open} onClose={close} className="tour" labelledBy="tour-title">
      {rect ? (
        <div
          className="tour__spot"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        />
      ) : (
        <div className="tour__dim" />
      )}
      <div ref={cardRef} className="tour__card" style={{ left: pos.left, top: pos.top }}>
        <div className="tour__step">
          {index + 1} of {steps.length}
        </div>
        <h2 id="tour-title" className="tour__title">
          {step.title}
        </h2>
        <div className="tour__body">
          {step.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {step.note && <p className="tour__about">{step.note}</p>}
        </div>
        <div className="tour__nav">
          {!last && (
            <button className="btn btn--muted" onClick={close}>
              Skip
            </button>
          )}
          <div className="tour__dots" aria-hidden>
            {steps.map((s, i) => (
              <span key={s.title} className={i === index ? 'tour__dot is-current' : 'tour__dot'} />
            ))}
          </div>
          {index > 0 && (
            <button className="btn" onClick={() => setIndex(index - 1)}>
              Back
            </button>
          )}
          {last ? (
            <button className="btn btn--primary" onClick={close} autoFocus>
              Let's go
            </button>
          ) : (
            <button className="btn btn--primary" onClick={() => setIndex(index + 1)} autoFocus>
              Next
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
