import type { Level } from '../sim/types'

export const level1: Level = {
  id: 1,
  title: 'Going viral',
  brief:
    'It worked, and now the page is going viral. Traffic will climb to 1,000 requests a second. Keep every component under 100%.',
  targetQps: 1000,
  budget: 350,
  rampMs: 8000,
  palette: ['lb', 'web', 'bigweb'],
  introduces: ['lb'],
  start: {
    nodes: [
      { id: 'users', type: 'users', name: 'Users', x: 80, y: 200 },
      { id: 'web1', type: 'web', name: 'Web server 1', x: 420, y: 200 },
    ],
    edges: [{ id: 'users->web1', from: 'users', to: 'web1' }],
  },
}
