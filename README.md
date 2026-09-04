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
- `src/levels/` is one data file per level: the starting board, what's in the tray, target QPS, budget, and the tutorial steps. Adding a level is a new file plus one line in `index.ts`.
- `src/ui/` is the React Flow board, the component tray, the level panel, the run loop, and the walkthrough.

## Deploy

The site is static and deploys to Cloudflare Workers as static assets (`wrangler.jsonc`). Connect the GitHub repo under Workers & Pages in the Cloudflare dashboard with build command `pnpm build` and it deploys on every push to `main`. To deploy by hand:

```
pnpm exec wrangler login
pnpm deploy
```
