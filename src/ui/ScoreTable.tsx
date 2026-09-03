import type { Score } from '../sim/types'
import { pct } from './format'

export function ScoreTable({ score }: { score: Score }) {
  return (
    <table className="score">
      <tbody>
        <tr>
          <td>Passed</td>
          <td>{score.base}</td>
        </tr>
        <tr>
          <td>Headroom (peak {pct(score.peakUtil)}%)</td>
          <td>+{score.headroom}</td>
        </tr>
        <tr>
          <td>Budget left (${score.budgetLeft})</td>
          <td>+{score.budgetLeft}</td>
        </tr>
        <tr>
          <td>Everything under 80%</td>
          <td>{score.bonus ? `+${score.bonus}` : '—'}</td>
        </tr>
        <tr className="score__total">
          <td>Score</td>
          <td>{score.total}</td>
        </tr>
      </tbody>
    </table>
  )
}
