import type { Graph, NodeSpec, NodeType } from './types'

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
    cacheable: ['public'],
  },
  web: {
    label: 'Web server',
    capacity: 300,
    cost: 50,
    distribute: 'fanout',
    blurb: 'Serves the page. Cheap, but one machine only goes so far.',
    needsDownstream: false,
    scored: true,
    cacheable: ['public', 'private'],
  },
  bigweb: {
    label: 'Large web server',
    capacity: 600,
    cost: 120,
    distribute: 'fanout',
    blurb: 'A beefier machine. More headroom per box, more dollars per request.',
    needsDownstream: false,
    scored: true,
    cacheable: ['public', 'private'],
  },
  cache: {
    label: 'Cache',
    capacity: 5000,
    cost: 150,
    distribute: 'fanout',
    blurb:
      'Cache-aside, Redis style. On a web server it serves that server’s reads; on the load balancer, **public** pages only. Hit rate grows with lookups, logarithmically:',
    needsDownstream: false,
    hitCurve: { baseLoad: 500, baseRate: 0.8, perDoubling: 0.1, max: 0.95 },
    sink: true,
    acceptsFrom: {
      types: ['lb', 'web', 'bigweb'],
      reason: 'A cache only answers lookups. Attach it to a load balancer or a web server.',
    },
  },
  db: {
    label: 'Database',
    capacity: 500,
    cost: 0,
    distribute: 'fanout',
    blurb: 'One managed database. Every cache miss and every write lands here. It cannot be scaled.',
    needsDownstream: false,
    scored: true,
    sink: true,
    acceptsFrom: { types: ['web', 'bigweb'], reason: 'Only the app talks to the database.' },
  },
}

export function costOf(graph: Graph): number {
  return graph.nodes.reduce((sum, n) => sum + CATALOGUE[n.type].cost, 0)
}
