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
    blurb: 'One address in. Spreads requests evenly across everything wired behind it.',
    needsDownstream: true,
  },
  web: {
    label: 'Web server',
    capacity: 300,
    cost: 50,
    distribute: 'fanout',
    blurb: 'Serves the page. Cheap, but one machine only goes so far.',
    needsDownstream: false,
  },
  bigweb: {
    label: 'Large web server',
    capacity: 600,
    cost: 120,
    distribute: 'fanout',
    blurb: 'A beefier machine. More headroom per box, more dollars per request.',
    needsDownstream: false,
  },
}

export function costOf(graph: Graph): number {
  return graph.nodes.reduce((sum, n) => sum + CATALOGUE[n.type].cost, 0)
}
