import { CATALOGUE } from './catalogue'
import type { Graph, NodeType, SimNode } from './types'

/** Test helpers for building graphs. Positions are irrelevant to the engine. */

export function node(type: NodeType, id: string): SimNode {
  return { id, type, name: `${CATALOGUE[type].label} ${id}`, x: 0, y: 0 }
}

export function edge(from: string, to: string) {
  return { id: `${from}->${to}`, from, to }
}

/** Names nodes per type: web1, web2, bigweb1 ... */
function named(types: NodeType[]): SimNode[] {
  const counts: Partial<Record<NodeType, number>> = {}
  return types.map((t) => node(t, `${t}${(counts[t] = (counts[t] ?? 0) + 1)}`))
}

/** users → a → b → c ... */
export function chain(...types: NodeType[]): Graph {
  const nodes = [node('users', 'users'), ...named(types)]
  const edges = nodes.slice(1).map((n, i) => edge(nodes[i].id, n.id))
  return { nodes, edges }
}

/** users → lb → each of the given types in parallel */
export function behindLb(...types: NodeType[]): Graph {
  const users = node('users', 'users')
  const lb = node('lb', 'lb1')
  const workers = named(types)
  return {
    nodes: [users, lb, ...workers],
    edges: [edge(users.id, lb.id), ...workers.map((w) => edge(lb.id, w.id))],
  }
}

export function repeat(type: NodeType, n: number): NodeType[] {
  return Array.from({ length: n }, () => type)
}
