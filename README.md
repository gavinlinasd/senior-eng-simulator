# Senior Eng Simulator

Play it: https://senior-eng-simulator.gavin-lin-asd.workers.dev/

A browser game that teaches distributed system design by letting you build an architecture and watch it fail under load. You wire servers and load balancers on a board, send a ramp of traffic, and the first component to hit 100% freezes the run so you can see what gave out. There is no lesson up front: you build it, it breaks, you work out why.

## Run it

```
pnpm install
pnpm dev      # http://localhost:3000
pnpm test     # simulation tests
pnpm build    # static site in dist/
```

Requires Node 22 or newer and pnpm.

## How it's put together

- `src/sim/` is the simulation: pure functions, no React. Traffic comes in public reads, private reads and writes, flows down a DAG, a load balancer splits it, everything else fans out. A cache-aside cache answers the reads it's allowed to see with a hit rate that grows with its lookups, and the lowest QPS at which any node reaches 100% is the breaking point, found by scanning the ramp. Fully unit-tested, including a proof that every level has a solution.
- `src/levels/` is one data file per level. Adding a level is a new file plus one line in `index.ts`; see below.
- `src/ui/` is the React Flow board, the component tray, the level panel, the run loop, and the walkthrough.

## Adding a level

A level is data. Describe boards as columns, left to right, and the builder positions and wires them:

```ts
export const level4 = defineLevel({
  id: 4,
  title: 'Product Hunt launch',
  brief: 'What the player reads in the panel.',
  targetQps: 4000,
  budget: 1000,
  traffic: { public: 0.5, private: 0.4, write: 0.1 },   // omit for all public reads
  requiresDatabase: true,                                // every web server must reach the database
  introduces: ['queue'],                                 // badged New; added to the inherited palette
  start: board('users', 'lb', { type: 'web', count: 6 }, ['cache', DATABASE]),
  carryOver: { add: [DATABASE], wireFrom: { db: ['web', 'bigweb'] } },  // what joins the board carried from the previous level
  solutions: [board('users', 'lb', { type: 'web', count: 9 }, ['cache', DATABASE])],
  traps: [board('users', 'lb', { type: 'web', count: 12 }, DATABASE)],
  stars: { three: 500, two: 350 },
  hints: ['Gentlest first.', 'More specific.', 'Nearly the answer.'],
  lesson: { title: 'What they just did', body: 'Shown on pass. **Bold** works.' },
})
```

The contract test in `src/levels/levels.test.ts` checks that the start board fails, that every solution passes within budget with at least one three-star design, and that every trap fails. Intros are generated from the level (story, goal, traffic mix, unlock card) unless the level writes its own `intro` steps, as level 0 does for its guided tutorial. `pnpm explore <level id>` prints every passing design the builder can make for a level, with scores, to help place the star thresholds.

Adding a component type is one entry in `src/sim/catalogue.ts` (capacity, cost, routing, wire rules, and roles such as `source`, `serves`, `store`, or a cache's hit curve) plus an icon in `src/ui/icons.ts`.

## Deploy

The site is static and deploys to Cloudflare Workers as static assets (`wrangler.jsonc`). Connect the GitHub repo under Workers & Pages in the Cloudflare dashboard with build command `pnpm build` and it deploys on every push to `main`. To deploy by hand:

```
pnpm exec wrangler login
pnpm deploy
```
