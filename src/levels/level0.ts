import type { Level } from '../sim/types'

export const level0: Level = {
  id: 0,
  title: 'One page, one server',
  brief:
    'Your landing page runs on one small web server. Tonight it gets featured somewhere big, and traffic will climb to 500 requests a second. Keep every component under 100%.',
  targetQps: 500,
  budget: 150,
  rampMs: 8000,
  palette: ['web', 'bigweb'],
  introduces: ['bigweb'],
  start: {
    nodes: [
      { id: 'users', type: 'users', name: 'Users', x: 80, y: 200 },
      { id: 'web1', type: 'web', name: 'Web server 1', x: 420, y: 200 },
    ],
    edges: [{ id: 'users->web1', from: 'users', to: 'web1' }],
  },
  intro: [
    {
      title: 'Your site is about to get popular',
      body: [
        "You're the only engineer at a tiny startup, and tonight the landing page gets featured somewhere big. Traffic will climb from nothing to 500 requests a second. Right now the whole site is one small web server.",
        'Every component has a limit. When any one of them hits 100%, the site is down and the run stops right there. Your job: design something that holds, within budget.',
      ],
      note: "This sandbox is for building intuition about how systems behave under load. There's no lesson up front. You build, send traffic, watch something turn red, and work out why.",
    },
    {
      target: 'board',
      title: 'The board',
      body: [
        'Your architecture. Drag components around. Wire them by dragging from a right-hand port to the left-hand port of another. Select something and press Delete to remove it.',
      ],
    },
    {
      target: 'tray',
      title: 'The tray',
      body: [
        'Everything you can add to the board. Drag a piece up, or click it. Each one shows how many requests a second it can take, and what it costs.',
      ],
    },
    {
      target: 'new',
      title: 'New this level',
      body: [
        "Each level unlocks one new component, and it's marked in the tray. Read the card: what it can take and what it costs is all you get.",
      ],
    },
    {
      target: 'panel',
      title: 'The level panel',
      body: [
        'The brief, the target, and your budget. Anything that blocks a run shows up here, and so does the verdict when a run ends.',
      ],
    },
    {
      target: 'hud',
      title: 'Send traffic',
      body: [
        'Ramps requests from zero to the target over a few seconds. Watch the utilization bars. If a component hits 100%, everything freezes so you can see what gave out.',
      ],
    },
    {
      title: 'Ready?',
      body: ['Your first design is already wired up. Send traffic and see what happens.'],
    },
  ],
}
