import { useLayoutEffect, useRef, useState } from 'react'
import type { ClassLoad, IntroStep, TourTarget } from '../sim/types'
import { PROVIDER_SHORT } from './brand'
import { ComponentCard } from './ComponentCard'
import { RichText } from './RichText'
import { TrafficMixBar } from './TrafficMixBar'

const TARGETS: Record<TourTarget, string> = {
  board: '.board',
  tray: '.tray',
  panel: '.panel',
  hud: '.hud',
  new: '.tray__item.is-new',
  locked: '.sim-node.is-locked',
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

const OBSTACLES = '.react-flow__node, .hud'

function measureObstacles(): Rect[] {
  return Array.from(document.querySelectorAll(OBSTACLES)).map((el) => {
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  })
}

const overlaps = (a: Rect, b: Rect, gap = 8) =>
  a.left < b.left + b.width + gap &&
  a.left + a.width + gap > b.left &&
  a.top < b.top + b.height + gap &&
  a.top + a.height + gap > b.top

/**
 * Where to put the card. Beside the spotlight if that fits, otherwise a free
 * corner of the board; every candidate is checked against the board's nodes
 * and the HUD so the card never hides what the step is asking the player to
 * touch. Falls back to the first candidate that fits the viewport.
 */
function place(rect: Rect | null, card: { width: number; height: number }, obstacles: Rect[]) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clampX = (x: number) => Math.min(Math.max(x, MARGIN), vw - card.width - MARGIN)
  const clampY = (y: number) => Math.min(Math.max(y, MARGIN), vh - card.height - MARGIN)
  if (!rect) return { left: (vw - card.width) / 2, top: (vh - card.height) / 2 }

  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const board = document.querySelector('.board')?.getBoundingClientRect()
  const candidates = [
    { left: clampX(cx - card.width / 2), top: rect.top + rect.height + GAP },
    { left: clampX(cx - card.width / 2), top: rect.top - GAP - card.height },
    { left: rect.left - GAP - card.width, top: clampY(cy - card.height / 2) },
    { left: rect.left + rect.width + GAP, top: clampY(cy - card.height / 2) },
  ]
  if (board) {
    const right = board.right - card.width - MARGIN
    const bottom = board.bottom - card.height - MARGIN
    candidates.push(
      { left: right, top: board.top + MARGIN },
      { left: right, top: bottom },
      { left: board.left + MARGIN, top: bottom },
      { left: board.left + MARGIN, top: board.top + MARGIN },
    )
  }
  const inViewport = (c: { left: number; top: number }) =>
    c.left >= MARGIN && c.top >= MARGIN && c.left + card.width <= vw - MARGIN && c.top + card.height <= vh - MARGIN
  const clear = (c: { left: number; top: number }) => {
    const box = { ...c, width: card.width, height: card.height }
    return !overlaps(box, rect) && !obstacles.some((o) => overlaps(box, o))
  }
  return (
    candidates.find((c) => inViewport(c) && clear(c)) ??
    candidates.find(inViewport) ?? { left: clampX(cx - card.width / 2), top: clampY(cy - card.height / 2) }
  )
}

interface TutorialProps {
  steps: IntroStep[]
  /** The level's traffic mix, for steps that show it. */
  traffic?: ClassLoad
  /** Current step, or null when the walkthrough is closed. */
  index: number | null
  onNext: () => void
  onBack: () => void
  onClose: () => void
}

/**
 * Guided walkthrough that spotlights part of the UI without blocking it, so a
 * step can ask the player to do something. Steps are level data; this only
 * knows how to point at parts of the page.
 */
export function Tutorial({ steps, traffic, index, onNext, onBack, onClose }: TutorialProps) {
  const [rect, setRect] = useState<Rect | null>(null)
  const [obstacles, setObstacles] = useState<Rect[]>([])
  const [card, setCard] = useState({ width: 400, height: 200 })
  const cardRef = useRef<HTMLDivElement>(null)
  const step = index === null ? null : steps[index]
  const target = step?.target

  useLayoutEffect(() => {
    if (!step) return
    const update = () => {
      setRect(target ? measure(target) : null)
      setObstacles(measureObstacles())
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect()
        setCard((c) => (c.width === r.width && c.height === r.height ? c : { width: r.width, height: r.height }))
      }
    }
    update()
    // Nodes move when dragged and the board pans; re-check after any pointer gesture ends.
    window.addEventListener('resize', update)
    window.addEventListener('pointerup', update)
    const observer = new ResizeObserver(update)
    const el = target ? document.querySelector(TARGETS[target]) : null
    if (el) observer.observe(el)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('pointerup', update)
      observer.disconnect()
    }
  }, [step, target, index])

  if (!step || index === null) return null
  const last = index === steps.length - 1
  const single = steps.length === 1
  // Steps that wait for the player leave the page bright and ring the target instead of dimming around it.
  const interactive = Boolean(step.advance)
  const pos = place(rect, card, interactive ? obstacles : [])

  return (
    <div className="tour" role="dialog" aria-labelledby="tour-title">
      {rect ? (
        <div
          className={interactive ? 'tour__ring' : 'tour__spot'}
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        />
      ) : (
        !interactive && <div className="tour__dim" />
      )}
      <div
        ref={cardRef}
        className={['tour__card', interactive ? 'tour__card--turn' : '', single ? 'tour__card--single' : ''].join(' ')}
        style={{ left: pos.left, top: pos.top }}
      >
        {!single && (
          <div className="tour__step">
            {index + 1} of {steps.length}
            {interactive && <span className="tour__turn">Your turn</span>}
          </div>
        )}
        <h2 id="tour-title" className="tour__title">
          {step.title}
        </h2>
        <div className="tour__body">
          {step.body.map((paragraph) => (
            <p key={paragraph}>
              <RichText text={paragraph} />
            </p>
          ))}
          {step.note && (
            <p className="tour__about">
              <RichText text={step.note} />
            </p>
          )}
          {step.showMix && traffic && (
            <div className="tour__figure">
              <div className="tour__caption">{step.mixTitle ?? 'Traffic mix'}</div>
              <TrafficMixBar traffic={traffic} />
            </div>
          )}
          {step.cards?.map((type) => (
            <div key={type} className="tour__figure">
              <div className="tour__caption">New from {PROVIDER_SHORT}</div>
              <div className="tray__item tray__item--static is-new">
                <ComponentCard type={type} isNew />
              </div>
            </div>
          ))}
        </div>
        <div className="tour__nav">
          {!single && (
            <button className="btn btn--muted" onClick={onClose}>
              Skip
            </button>
          )}
          <div className="tour__dots" aria-hidden>
            {!single &&
              steps.map((s, i) => (
                <span key={s.title} className={i === index ? 'tour__dot is-current' : 'tour__dot'} />
              ))}
          </div>
          {index > 0 && (
            <button className="btn" onClick={onBack}>
              Back
            </button>
          )}
          {step.advance ? (
            <span className="tour__wait">{step.wait ?? 'This step finishes when you do it.'}</span>
          ) : (
            <button key={index} className="btn btn--primary" onClick={last ? onClose : onNext} autoFocus>
              {single ? "Let's go" : last ? 'Done' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
