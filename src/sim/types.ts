/** Pure simulation types. Nothing in src/sim imports React or the DOM. */

export type NodeType = 'users' | 'lb' | 'web' | 'bigweb'

/** How a node passes load to its outgoing edges. */
export type Distribute = 'split' | 'fanout'

export interface NodeSpec {
  label: string
  /** Requests per second before the node saturates. Infinity for the source. */
  capacity: number
  cost: number
  /** split: load / outgoing edges (round robin). fanout: full load down every edge. */
  distribute: Distribute
  /** One-liner shown in the component tray. */
  blurb: string
  /** Validation error if this node has no outgoing edges. */
  needsDownstream: boolean
}

export interface SimNode {
  id: string
  type: NodeType
  name: string
  /** Board position. The engine ignores it; levels need it for the starting layout. */
  x: number
  y: number
}

export interface SimEdge {
  id: string
  from: string
  to: string
}

export interface Graph {
  nodes: SimNode[]
  edges: SimEdge[]
}

/** Fraction of user traffic that lands on each node, keyed by node id. */
export type Shares = Record<string, number>

export interface NodeResult {
  load: number
  util: number
}

export type Evaluation = Record<string, NodeResult>

export interface BreakingPoint {
  qps: number
  nodeId: string
}

export type Status = 'ok' | 'warn' | 'over'

/** Areas of the UI a walkthrough step can spotlight. 'new' is the tray item badged as new this level. */
export type TourTarget = 'board' | 'tray' | 'panel' | 'hud' | 'new'

export interface IntroStep {
  target?: TourTarget
  title: string
  /** Paragraphs. */
  body: string[]
  /** Small print under the body. */
  note?: string
}

export interface Level {
  id: number
  title: string
  brief: string
  targetQps: number
  budget: number
  rampMs: number
  /** Node types the player can add. */
  palette: NodeType[]
  /** Node types unlocked by this level. Badged as new in the tray. */
  introduces?: NodeType[]
  /** The initial architecture. */
  start: Graph
  /** Walkthrough shown the first time the level is entered. */
  intro?: IntroStep[]
}

export interface Score {
  base: number
  headroom: number
  budgetLeft: number
  bonus: number
  total: number
  peakUtil: number
}
