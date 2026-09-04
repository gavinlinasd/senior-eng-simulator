import { Star } from 'lucide-react'

interface StarsProps {
  earned: number
  size?: number
  /** Score needed for the next star; shown as a hint when present. */
  nextAt?: number | null
}

/** Three stars, filled for the ones earned and empty for the ones missed. */
export function Stars({ earned, size = 20, nextAt }: StarsProps) {
  return (
    <div className="stars" role="img" aria-label={`${earned} of 3 stars`}>
      <div className="stars__row">
        {[1, 2, 3].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= earned ? 'stars__star is-earned' : 'stars__star'}
            fill={n <= earned ? 'currentColor' : 'none'}
            aria-hidden
          />
        ))}
      </div>
      {nextAt !== null && nextAt !== undefined && <div className="stars__hint">Next star at {nextAt} points</div>}
    </div>
  )
}
