import type { Edge, Node, XYPosition } from '@xyflow/react'
import type { Graph, NodeType } from '../sim/types'

/** Bridge between React Flow's editing state and the pure sim graph. */

export type SimNodeData = { simType: NodeType; name: string; seq: number }
export type FlowNode = Node<SimNodeData, 'sim'>
export type FlowEdge = Edge

export const DRAG_MIME = 'application/x-sim-node-type'

export function makeFlowNode(id: string, type: NodeType, name: string, seq: number, position: XYPosition): FlowNode {
  return { id, type: 'sim', position, data: { simType: type, name, seq }, deletable: type !== 'users' }
}

export function makeFlowEdge(source: string, target: string): FlowEdge {
  return { id: `${source}->${target}`, source, target, type: 'traffic' }
}

/** Next per-type sequence number, so a new server is "Web server 2" after "Web server 1". */
export function nextSeq(nodes: FlowNode[], type: NodeType): number {
  let max = 0
  for (const n of nodes) if (n.data.simType === type && n.data.seq > max) max = n.data.seq
  return max + 1
}

export function fromLevel(start: Graph): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const counts: Partial<Record<NodeType, number>> = {}
  const nodes = start.nodes.map((n) => {
    const seq = (counts[n.type] = (counts[n.type] ?? 0) + 1)
    return makeFlowNode(n.id, n.type, n.name, seq, { x: n.x, y: n.y })
  })
  const edges = start.edges.map((e) => makeFlowEdge(e.from, e.to))
  return { nodes, edges }
}

export function toGraph(nodes: FlowNode[], edges: FlowEdge[]): Graph {
  return {
    nodes: nodes.map((n) => ({ id: n.id, type: n.data.simType, name: n.data.name, x: n.position.x, y: n.position.y })),
    edges: edges.map((e) => ({ id: e.id, from: e.source, to: e.target })),
  }
}
