import { DATABASE, board, defineLevel } from './build'

const web = (count: number) => ({ type: 'web' as const, count })

export const level2 = defineLevel({
  id: 2,
  title: 'Launch on Product Hunt',
  brief:
    'The landing page grew into an app with accounts and comments, so every request needs the database. Today it launches on Product Hunt. Traffic will climb to 1,500 requests a second, 90% reads and 10% writes. The database is one managed box that cannot be scaled.',
  targetQps: 1500,
  budget: 650,
  traffic: { public: 0, private: 0.9, write: 0.1 },
  requiresDatabase: true,
  introduces: ['cache'],
  start: board('users', 'lb', web(2), DATABASE),
  carryOver: { add: [DATABASE], wireFrom: { db: ['web', 'bigweb'] } },
  solutions: [
    board('users', 'lb', web(8), ['cache', DATABASE]),
    board('users', 'lb', web(6), ['cache', DATABASE]),
    board('users', 'lb', { type: 'bigweb', count: 3 }, ['cache', DATABASE]),
  ],
  traps: [
    // more servers, no cache: the database still gets everything
    board('users', 'lb', web(8), DATABASE),
    // an edge cache alone can't serve the private reads
    board('users', 'lb', [web(6), { type: 'cache', id: 'edge', from: ['lb1'] }], DATABASE),
  ],
  stars: { three: 450, two: 300 },
  hints: [
    'Watch which card turns red first. The database receives everything the web servers receive, however many servers there are.',
    'Look at the traffic mix in the HUD. Reads can be answered from a cache; writes can’t. Nine in ten requests are reads.',
    'Attach a cache to each web server and keep the database wire. Reads mostly stop at the cache; misses and writes still go through.',
  ],
  intro: [
    {
      title: 'Launch day',
      body: [
        'The app has accounts and comments now, so every request needs the database. It launches on Product Hunt today.',
        'The database is already on the board, wired from every web server. It can’t be scaled or removed.',
        'Requests come in two kinds now. **Reads** fetch what’s already there; **writes** change it. They flow through the system differently, and the board shows both.',
      ],
      showGoal: true,
      showMix: true,
      mixTitle: 'New: traffic mix',
      cards: ['cache'],
    },
  ],
  lesson: {
    title: 'You just added a **read cache**',
    body: 'Most traffic was reads of the same data. A **cache-aside** cache answered them from memory, so the database only saw **misses and writes**. **The database is usually what falls over**: it’s the one part you can’t just add more of.',
  },
})
