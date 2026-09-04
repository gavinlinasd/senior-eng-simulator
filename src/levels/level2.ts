import type { Level, SimNode } from '../sim/types'

const database: SimNode = { id: 'db', type: 'db', name: 'Database', x: 700, y: 255, locked: true }

export const level2: Level = {
  id: 2,
  title: 'Reddit traffic',
  brief:
    'The landing page grew into an app with accounts and comments, so every request needs the database. Someone posted it to Reddit. Traffic will climb to 1,500 requests a second: 40% public pages, 50% private reads, 10% writes. The database is one managed box that cannot be scaled.',
  targetQps: 1500,
  budget: 650,
  rampMs: 5000,
  stars: { three: 450, two: 300 },
  traffic: { public: 0.4, private: 0.5, write: 0.1 },
  palette: ['lb', 'web', 'bigweb', 'cache'],
  introduces: ['cache'],
  start: {
    nodes: [
      { id: 'users', type: 'users', name: 'Users', x: 80, y: 255 },
      { id: 'lb1', type: 'lb', name: 'Load balancer 1', x: 380, y: 255 },
      { id: 'web1', type: 'web', name: 'Web server 1', x: 700, y: 200 },
      { id: 'web2', type: 'web', name: 'Web server 2', x: 700, y: 310 },
      { ...database, x: 1020 },
    ],
    edges: [
      { id: 'users->lb1', from: 'users', to: 'lb1' },
      { id: 'lb1->web1', from: 'lb1', to: 'web1' },
      { id: 'lb1->web2', from: 'lb1', to: 'web2' },
      { id: 'web1->db', from: 'web1', to: 'db' },
      { id: 'web2->db', from: 'web2', to: 'db' },
    ],
  },
  carryOver: {
    add: [database],
    wireFrom: { db: ['web', 'bigweb'] },
  },
  intro: [
    {
      title: 'Reddit found you',
      body: [
        'The app has accounts and comments now, so every request needs the database. Someone posted it to Reddit: 1,500 requests a second on a $650 budget.',
        'The database is already on the board, wired from every web server. It can’t be scaled or removed.',
      ],
      showMix: true,
      cards: ['cache'],
    },
  ],
  lesson: {
    title: 'You just added a read cache',
    body: 'Most traffic was reads of the same data, so a **cache-aside** cache answered them from memory and the database only saw misses and writes. The database is usually the thing that falls over, because it’s the one part you can’t just add more of. A cache on the load balancer only ever serves public pages, since it never sees who’s asking, so private reads still need a cache behind the app.',
  },
}
