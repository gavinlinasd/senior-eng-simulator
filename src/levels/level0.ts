import { board, defineLevel } from './build'

export const level0 = defineLevel({
  id: 0,
  title: 'Hacker News traffic',
  brief:
    'Someone posted your landing page to Hacker News. The whole site is one small web server, and traffic is about to climb to 500 requests a second. Keep every component under 100%.',
  targetQps: 500,
  budget: 150,
  palette: ['web', 'bigweb'],
  introduces: ['bigweb'],
  start: board('users', 'web'),
  solutions: [board('users', 'bigweb')],
  traps: [board('users', 'web')],
  stars: { three: 140, two: 100 },
  hints: [
    'Look at the max QPS on each card in the tray. One of them can take 500 requests a second on its own.',
    'Remove the small server (hover it and click the ×), add the large one, and wire Users to it.',
  ],
  intro: [
    {
      title: 'Your site just hit the front page',
      body: [
        "You're the only engineer at a tiny startup, and someone just posted your landing page to Hacker News. Traffic will climb from nothing to 500 requests a second. Right now the whole site is one small web server.",
      ],
      note: 'Every component has a max QPS. When any one of them hits 100%, the site is down and the run stops right there.',
    },
    {
      target: 'tray',
      title: 'Meet Bmazon Web Service',
      body: [
        'All the products available to you, with their capacity and cost. New products unlock in later levels.',
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
  lesson: {
    title: 'You just did **vertical scaling**',
    body: 'One machine couldn’t keep up, so you swapped it for a bigger one. That’s **vertical scaling**: more capacity per box. **It runs out fast**: boxes only get so big, and the price climbs faster than the capacity.',
  },
})
