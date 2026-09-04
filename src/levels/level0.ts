import type { Level } from '../sim/types'

export const level0: Level = {
  id: 0,
  title: 'Hacker News traffic',
  brief:
    'Someone posted your landing page to Hacker News. The whole site is one small web server, and traffic is about to climb to 500 requests a second. Keep every component under 100%.',
  targetQps: 500,
  budget: 150,
  rampMs: 5000,
  stars: { three: 140, two: 100 },
  palette: ['web', 'bigweb'],
  introduces: ['bigweb'],
  lesson: {
    title: 'You just did vertical scaling',
    body: 'One machine couldn’t keep up, so you swapped it for a bigger one. That’s **vertical scaling**: more capacity per box. It’s the simplest fix, and it runs out fast, because boxes only get so big and the price climbs faster than the capacity.',
  },
  start: {
    nodes: [
      { id: 'users', type: 'users', name: 'Users', x: 80, y: 200 },
      { id: 'web1', type: 'web', name: 'Web server 1', x: 420, y: 200 },
    ],
    edges: [{ id: 'users->web1', from: 'users', to: 'web1' }],
  },
  intro: [
    {
      title: 'Your site just hit the front page',
      body: [
        "You're the only engineer at a tiny startup, and someone just posted your landing page to Hacker News. Traffic will climb from nothing to 500 requests a second. Right now the whole site is one small web server.",
        'The board is your architecture. The strip along the bottom is your cloud provider. The panel on the right has the brief, your budget, and the verdict after each run.',
      ],
      note: 'Every component has a max QPS. When any one of them hits 100%, the site is down and the run stops right there.',
    },
    {
      target: 'tray',
      title: 'Meet Bmazon Web Service',
      body: [
        'Everything you can rent. Each card shows the most requests a second that machine can take, and what it costs. Drag one onto the board, or click it. The card marked New is this level’s unlock.',
      ],
    },
    {
      target: 'hud',
      title: 'Send traffic',
      body: ['Press Send traffic. Requests ramp from zero toward 500 a second. Keep an eye on the CPU meters.'],
      advance: 'failed',
      wait: 'This step finishes when the run does.',
    },
    {
      target: 'new',
      title: 'That was the site falling over',
      body: [
        'Web server 1 maxes out at 300 requests a second, and Hacker News is sending 500. Bmazon rents a bigger machine.',
        'Hover the small server and click its × to remove it. Click the large web server to add it, wire Users to it, then send traffic again.',
      ],
      advance: 'passed',
      wait: 'This step finishes when a run passes.',
    },
  ],
}
