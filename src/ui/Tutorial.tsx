import { useLayoutEffect, useRef, useState } from 'react'
import type { ClassLoad, IntroStep, TourTarget } from '../sim/types'
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
  const [card, setCard] = useState({ width: 400, height: 200 })
  const cardRef = useRef<HTMLDivElement>(null)
  const step = index === null ? null : steps[index]
  const target = step?.target

  useLayoutEffect(() => {
    if (!step) return
    const update = () => {
      setRect(target ? measure(target) : null)
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect()
        setCard((c) => (c.width === r.width && c.height === r.height ? c : { width: r.width, height: r.height }))
      }
    }
    update()
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    const el = target ? document.querySelector(TARGETS[target]) : null
    if (el) observer.observe(el)
    return () => {
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [step, target, index])

  if (!step || index === null) return null
  const last = index === steps.length - 1
  const single = steps.length === 1
  const pos = place(rect, card)
  // Steps that wait for the player leave the page bright and ring the target instead of dimming around it.
  const interactive = Boolean(step.advance)

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
              <div className="tour__caption">Traffic mix</div>
              <TrafficMixBar traffic={traffic} />
            </div>
          )}
          {step.cards?.map((type) => (
            <div key={type} className="tour__figure">
              <div className="tour__caption">New from Bmazon</div>
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
