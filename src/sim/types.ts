/** Pure simulation types. Nothing in src/sim imports React or the DOM. */

export type NodeType = 'users' | 'lb' | 'web' | 'bigweb' | 'cache' | 'db'

/**
 * Requests come in three classes that flow through the system differently.
 * Public reads (landing page, images) can be served by any cache. Private
 * reads (your feed) need a signed-in user, so only a cache behind the app can
 * serve them. Writes always reach the database.
 */
export type TrafficClass = 'public' | 'private' | 'write'
export interface ClassLoad {
  public: number
  private: number
  write: number
}

/** Cache hit rate as a function of the lookups flowing through it, on a log curve. */
export interface HitCurve {
  /** Lookups per second at which the hit rate equals baseRate. */
  baseLoad: number
  baseRate: number
  /** Added to the hit rate each time the lookups double. */
  perDoubling: number
  max: number
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
   * Makes this a cache-aside cache. Nodes wired into it send it all their
   * reads as lookups; it can only answer the classes its feeder is allowed to
   * cache, the hit rate depends on the lookups it can serve, and hits never
   * flow down the feeder's other wires.
   */
  hitCurve?: HitCurve
  /** Which classes a cache attached to this node type is allowed to serve. */
  cacheable?: TrafficClass[]
  /** Node types allowed to wire into this one, with the reason shown when violated. Absent = anything. */
  acceptsFrom?: { types: NodeType[]; reason: string }
  /** True if requests stop here: no outgoing wires. */
  sink?: boolean
  /** Spare capacity on this type counts toward the score. */
  scored?: boolean
  /** The app tier: nodes that actually handle requests and talk to the database. */
  serves?: boolean
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

/** Requests per second arriving at each node, by class, keyed by node id. */
export type Loads = Record<string, ClassLoad>

export interface NodeResult extends ClassLoad {
  /** Total requests per second. For a cache, its lookups. */
  load: number
  util: number
  /** Caches only: fraction of all lookups answered at this load. */
  hitRate?: number
  /** Caches only: hit rate per read class. A class the cache can't serve from where it sits reads 0. */
  hitRates?: { public: number; private: number }
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
  /** Show the level's traffic mix as a bar. */
  showMix?: boolean
  /** Component cards to show, as they appear in the tray. */
  cards?: NodeType[]
}

export interface Level {
  id: number
  title: string
  brief: string
  targetQps: number
  budget: number
  rampMs: number
  /** Mix of user traffic by class, fractions summing to 1. Default: all public reads. */
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
  /** Score thresholds for three and two stars. Any pass earns one. */
  stars: { three: number; two: number }
  /** Every request needs the database: each app-tier node must be wired to one. */
  requiresDatabase?: boolean
  /** Progressive hints, gentlest first, revealed one at a time on request. */
  hints?: string[]
}

export interface Score {
  base: number
  headroom: number
  budgetLeft: number
  bonus: number
  total: number
  peakUtil: number
  /** 1 to 3 for a pass. */
  stars: number
  /** Score needed for the next star, if any. */
  nextStarAt: number | null
}
