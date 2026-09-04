import { DATABASE, board, defineLevel } from './build'

const web = (count: number) => ({ type: 'web' as const, count })
const edge = { type: 'cache' as const, id: 'edge', name: 'Edge cache', from: ['lb1'] }

/** Same tools as level 2, five times the traffic. No new unlock, no hand-holding. */
export const level3 = defineLevel({
  id: 3,
  title: 'Front page of the internet',
  brief:
    'Now it’s on the front page of Reddit. Traffic will climb to 3,000 requests a second: half of it the public landing page and images, 40% personalized feeds, 10% writes. Same tools, same database.',
  targetQps: 3000,
  budget: 850,
  traffic: { public: 0.5, private: 0.4, write: 0.1 },
  requiresDatabase: true,
  start: board('users', 'lb', web(6), ['cache', DATABASE]),
  solutions: [
    // edge cache on the balancer plus the shared app cache, sized up to the budget
    board('users', 'lb', [web(9), edge], ['cache', DATABASE]),
    board('users', 'lb', [web(6), edge], ['cache', DATABASE]),
    // brute force: twelve small servers and one shared app cache, right at budget
    board('users', 'lb', web(12), ['cache', DATABASE]),
  ],
  traps: [
    // an edge cache alone, no app cache
    board('users', 'lb', [web(6), edge], DATABASE),
    // one cache per server instead of a shared one
    board('users', 'lb', web(12), [...Array.from({ length: 6 }, (_, i) => ({ type: 'cache' as const, from: [`web${i + 1}`] })), DATABASE]),
  ],
  stars: { three: 500, two: 350 },
  hints: [
    'Half the traffic is **public** pages that need no sign-in. Something could answer those before they ever reach a web server.',
    'A cache’s hit rate depends on how many lookups it sees. One shared cache warms up; several small ones stay cold.',
    'Try a cache on the load balancer, then read the hit-rate split on its card. What it can and can’t serve tells you where the rest has to go.',
  ],
  lesson: {
    title: '**Where a cache sits** decides what it can serve',
    body: 'A cache on the load balancer never sees who is asking, so it serves **public pages only**, before they reach a web server. A cache behind the app serves **private reads** too. Hit rate grows with lookups, so **one shared cache beats several small ones**.',
  },
})
