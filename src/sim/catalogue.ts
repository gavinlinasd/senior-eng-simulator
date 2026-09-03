import type { Graph, NodeSpec, NodeType } from './types'

const APP_TIER: NodeType[] = ['web', 'bigweb']

/** Node type registry. Adding a type is one entry here plus an icon in the UI. */
export const CATALOGUE: Record<NodeType, NodeSpec> = {
  users: {
    label: 'Users',
    capacity: Infinity,
    cost: 0,
    distribute: 'fanout',
    blurb: 'Where requests come from. They only know one address.',
    needsDownstream: false,
  },
  lb: {
    label: 'Load balancer',
    capacity: 5000,
    cost: 100,
    distribute: 'split',
    blurb: 'One address in. Spreads requests **evenly** (Round Robin) across everything wired behind it.',
    needsDownstream: true,
  },
  web: {
    label: 'Web server',
    scored: true,
    capacity: 300,
    cost: 50,
    distribute: 'fanout',
    blurb: 'Serves the page. Cheap, but one machine only goes so far.',
    needsDownstream: false,
  },
  bigweb: {
    label: 'Large web server',
    scored: true,
    capacity: 600,
    cost: 120,
    distribute: 'fanout',
    blurb: 'A beefier machine. More headroom per box, more dollars per request.',
    needsDownstream: false,
  },
  cache: {
    label: 'Cache',
    capacity: 5000,
    cost: 150,
    distribute: 'fanout',
    blurb:
      'Cache-aside, Redis style. A web server wired to it checks it first: it answers **85% of reads**. Misses and all writes go on down the server’s other wires.',
    needsDownstream: false,
    absorbs: { read: 0.85 },
    sink: true,
    acceptsFrom: {
      types: APP_TIER,
      reason: 'Requests need a signed-in user before anything can be served, and only web servers do that.',
    },
  },
  db: {
    label: 'Database',
    scored: true,
    capacity: 500,
    cost: 0,
    distribute: 'fanout',
    blurb: 'One managed database. Every cache miss and every write lands here. It cannot be scaled.',
    needsDownstream: false,
    sink: true,
    acceptsFrom: { types: APP_TIER, reason: 'Only the app talks to the database.' },
  },
}

export function costOf(graph: Graph): number {
  return graph.nodes.reduce((sum, n) => sum + CATALOGUE[n.type].cost, 0)
}
