import type { Level } from '../sim/types'

export const level1: Level = {
  id: 1,
  title: 'Serve a static page',
  brief:
    'A landing page is about to get a burst of attention. Keep every component under 100% while traffic climbs to the target.',
  targetQps: 1000,
  budget: 350,
  rampMs: 8000,
  palette: ['lb', 'web', 'bigweb'],
  start: {
    nodes: [
      { id: 'users', type: 'users', name: 'Users', x: 80, y: 200 },
      { id: 'web1', type: 'web', name: 'Web server 1', x: 420, y: 200 },
    ],
    edges: [{ id: 'users->web1', from: 'users', to: 'web1' }],
  },
}
