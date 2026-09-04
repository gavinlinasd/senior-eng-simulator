import type { Level, SimNode } from '../sim/types'

const database: SimNode = { id: 'db', type: 'db', name: 'Database', x: 700, y: 255, locked: true }

export const level2: Level = {
  id: 2,
  title: 'Reddit traffic',
  brief:
    'The landing page grew into an app with accounts and comments, so every request needs the database. Someone posted it to Reddit. Traffic will climb to 1,500 requests a second, 90% reads and 10% writes. The database is one managed box that cannot be scaled.',
  targetQps: 1500,
  budget: 650,
  rampMs: 5000,
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
        'The landing page grew into an app. People have accounts and post comments, so every request now needs the database. Someone just posted it to Reddit, and traffic will climb to 1,500 requests a second.',
        '40% of those requests are **public** pages, 50% are **private** reads like someone’s own feed, and 10% are **writes**. They flow through the system differently, and the board now shows all three.',
      ],
    },
    {
      target: 'locked',
      title: 'The database',
      body: [
        'One managed database, already paid for and already wired from every web server. Bmazon won’t sell you a bigger one, and you can’t remove it.',
      ],
    },
    {
      target: 'new',
      title: 'New from Bmazon: Cache',
      body: [
        'Cache-aside, Redis style. Attach it to a web server and the server checks it first for reads. Attach it to the load balancer and it answers public pages before they reach your servers. Either way, misses and writes carry on, and the more lookups a cache sees, the better it hits.',
      ],
    },
    {
      target: 'hud',
      title: 'Watch the mix',
      body: ['Cards and wires now show reads and writes separately. Send traffic and see who gets what.'],
    },
  ],
  lesson: {
    title: 'You just added a read cache',
    body: 'Most traffic was reads of the same data, so a **cache-aside** cache answered them from memory and the database only saw misses and writes. The database is usually the thing that falls over, because it’s the one part you can’t just add more of. A cache on the load balancer only ever serves public pages, since it never sees who’s asking, so private reads still need a cache behind the app.',
  },
}
