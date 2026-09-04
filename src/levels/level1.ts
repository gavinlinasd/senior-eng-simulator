import type { Level } from '../sim/types'

export const level1: Level = {
  id: 1,
  title: 'Twitter/X traffic',
  brief:
    'It held, and now someone posted it on X. Traffic will climb to 1,000 requests a second. Keep every component under 100%.',
  targetQps: 1000,
  budget: 350,
  rampMs: 5000,
  stars: { three: 300, two: 200 },
  palette: ['lb', 'web', 'bigweb'],
  introduces: ['lb'],
  lesson: {
    title: 'You just did horizontal scaling',
    body: 'No single box could serve 1,000 requests a second, so you put a **load balancer** in front and spread the work across several. That’s **horizontal scaling**: more boxes instead of a bigger box. The load balancer gives users one address, and round robin decides which box serves each request. More than one design passes this level. Try a mix of large and small boxes behind the balancer, watch which one gives out first, and compare scores.',
  },
  start: {
    nodes: [
      { id: 'users', type: 'users', name: 'Users', x: 80, y: 200 },
      { id: 'web1', type: 'web', name: 'Web server 1', x: 420, y: 200 },
    ],
    edges: [{ id: 'users->web1', from: 'users', to: 'web1' }],
  },
}
