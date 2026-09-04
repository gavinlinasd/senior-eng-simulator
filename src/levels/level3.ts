import type { Level, SimEdge, SimNode } from '../sim/types'

const webs: SimNode[] = Array.from({ length: 6 }, (_, i) => ({
  id: `web${i + 1}`,
  type: 'web',
  name: `Web server ${i + 1}`,
  x: 700,
  y: 40 + i * 110,
}))

const start = {
  nodes: [
    { id: 'users', type: 'users', name: 'Users', x: 80, y: 315 },
    { id: 'lb1', type: 'lb', name: 'Load balancer 1', x: 380, y: 315 },
    ...webs,
    { id: 'cache1', type: 'cache', name: 'Cache 1', x: 1020, y: 200 },
    { id: 'db', type: 'db', name: 'Database', x: 1020, y: 430, locked: true },
  ] as SimNode[],
  edges: [
    { id: 'users->lb1', from: 'users', to: 'lb1' },
    ...webs.map((w): SimEdge => ({ id: `lb1->${w.id}`, from: 'lb1', to: w.id })),
    ...webs.map((w): SimEdge => ({ id: `${w.id}->cache1`, from: w.id, to: 'cache1' })),
    ...webs.map((w): SimEdge => ({ id: `${w.id}->db`, from: w.id, to: 'db' })),
  ],
}

/** Same tools as level 2, five times the traffic. No new unlock, no hand-holding. */
export const level3: Level = {
  id: 3,
  title: 'Front page of the internet',
  brief:
    'Now it’s on the front page. Traffic will climb to 3,000 requests a second: half of it the public landing page and images, 40% personalized feeds, 10% writes. Same tools, same database.',
  targetQps: 3000,
  budget: 850,
  rampMs: 5000,
  hints: [
    'Half the traffic is **public** pages that need no sign-in. Something could answer those before they ever reach a web server.',
    'A cache’s hit rate depends on how many lookups it sees. One shared cache warms up; several small ones stay cold.',
    'Try a cache on the load balancer, then read the hit-rate split on its card. What it can and can’t serve tells you where the rest has to go.',
  ],
  stars: { three: 500, two: 350 },
  requiresDatabase: true,
  traffic: { public: 0.5, private: 0.4, write: 0.1 },
  palette: ['lb', 'web', 'bigweb', 'cache'],
  start,
  lesson: {
    title: 'Where a cache sits decides what it can serve',
    body: 'A cache on the load balancer never sees who is asking, so it can only serve **public** pages, but it serves them before they touch a web server. A cache behind the app sees signed-in requests and serves **private** reads too. And every cache gets better the more lookups it sees, so one shared cache beats a handful of small ones.',
  },
}
