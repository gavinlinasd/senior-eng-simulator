/** Pure simulation types. Nothing in src/sim imports React or the DOM. */

export type NodeType = 'users' | 'lb' | 'web' | 'bigweb' | 'cache' | 'db'

/** Requests come in two classes that flow through the system differently. */
export type TrafficClass = 'read' | 'write'
export interface ClassLoad {
  read: number
  write: number
}

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
  /**
   * Cache-aside: fraction of each class this node answers on behalf of the
   * nodes wired into it, so that much never flows down their other wires.
   * The node itself receives the full class as lookups.
   */
  absorbs?: Partial<ClassLoad>
  /** Node types allowed to wire into this one, with the reason shown when violated. Absent = anything. */
  acceptsFrom?: { types: NodeType[]; reason: string }
  /** True if requests stop here: no outgoing wires. */
  sink?: boolean
}

export interface SimNode {
  id: string
  type: NodeType
  name: string
  /** Board position. The engine ignores it; levels need it for the starting layout. */
  x: number
  y: number
  /** Cannot be removed by the player. */
  locked?: boolean
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

/** Fraction of user traffic that lands on each node, by class, keyed by node id. */
export type Shares = Record<string, ClassLoad>

export interface NodeResult {
  load: number
  read: number
  write: number
  util: number
}

export type Evaluation = Record<string, NodeResult>

export interface BreakingPoint {
  qps: number
  nodeId: string
}

export type Status = 'ok' | 'warn' | 'over'

/**
 * Areas of the UI a walkthrough step can spotlight. 'new' is the tray item
 * badged as new this level, 'locked' the first locked node on the board.
 */
export type TourTarget = 'board' | 'tray' | 'panel' | 'hud' | 'new' | 'locked'

export interface IntroStep {
  target?: TourTarget
  title: string
  /** Paragraphs. */
  body: string[]
  /** Small print under the body. */
  note?: string
  /**
   * Instead of a Next button, the step completes when a run ends this way.
   * A pass always ends the walkthrough, whatever the current step.
   */
  advance?: 'failed' | 'passed'
  /** Caption shown while waiting for `advance`. */
  wait?: string
}

export interface Level {
  id: number
  title: string
  brief: string
  targetQps: number
  budget: number
  rampMs: number
  /** Read/write mix of user traffic, fractions summing to 1. Default: all reads. */
  traffic?: ClassLoad
  /** Node types the player can add. */
  palette: NodeType[]
  /** Node types unlocked by this level. Badged as new in the tray. */
  introduces?: NodeType[]
  /** The initial architecture when the level is entered directly. */
  start: Graph
  /**
   * How the board the player passed the previous level with becomes this
   * level's start. Absent: the board carries over unchanged.
   */
  carryOver?: {
    /** Nodes added to the board, placed to the right of what's there. */
    add: SimNode[]
    /** For each added node id, the node types already on the board that get wired into it. */
    wireFrom: Record<string, NodeType[]>
  }
  /** Walkthrough shown the first time the level is entered. */
  intro?: IntroStep[]
  /** Takeaway shown when the level is passed. Names the technique the player just used. */
  lesson?: { title: string; body: string }
}

export interface Score {
  base: number
  headroom: number
  budgetLeft: number
  bonus: number
  total: number
  peakUtil: number
}
