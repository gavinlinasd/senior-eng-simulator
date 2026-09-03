import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react'
import { LEVELS } from './levels'
import { CATALOGUE, costOf } from './sim/catalogue'
import { breakingPoint, computeShares, evaluate } from './sim/engine'
import { score as scoreOf } from './sim/score'
import type { NodeType } from './sim/types'
import { validate } from './sim/validate'
import { Board } from './ui/Board'
import { fromLevel, makeFlowEdge, makeFlowNode, nextSeq, toGraph, type FlowEdge, type FlowNode } from './ui/flow'
import { introSeen, markIntroSeen } from './ui/intro'
import { LevelPanel } from './ui/LevelPanel'
import { RunContext, type RunState } from './ui/RunContext'
import { RunHud } from './ui/RunHud'
import { SuccessModal } from './ui/SuccessModal'
import { Tray } from './ui/Tray'
import { Tutorial } from './ui/Tutorial'
import { useTrafficRun } from './ui/useTrafficRun'

/** First grid slot (columns to the right of users, rows downward) not already occupied by a node. */
function freeSlot(nodes: FlowNode[]): XYPosition {
  for (let i = 0; i < 24; i++) {
    const p = { x: 420 + Math.floor(i / 4) * 260, y: 200 + (i % 4) * 110 }
    const taken = nodes.some((n) => Math.abs(n.position.x - p.x) < 200 && Math.abs(n.position.y - p.y) < 80)
    if (!taken) return p
  }
  return { x: 420, y: 200 }
}

/** Adding or removing nodes/edges invalidates a run. Moving or selecting does not. */
function isStructural(changes: Array<NodeChange<FlowNode> | EdgeChange<FlowEdge>>) {
  return changes.some((c) => c.type === 'add' || c.type === 'remove')
}

function Game() {
  const level = LEVELS[0]
  const initial = useMemo(() => fromLevel(level.start), [level])
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(initial.edges)
  const { deleteElements } = useReactFlow()

  useEffect(() => {
    document.title = `Level ${level.id} · ${level.title}`
  }, [level])

  // Derived sim state. Recomputed on every edit; the model is linear so this is cheap.
  const graph = useMemo(() => toGraph(nodes, edges), [nodes, edges])
  const shares = useMemo(() => computeShares(graph), [graph])
  const errors = useMemo(() => validate(graph, level), [graph, level])
  const spend = costOf(graph)
  const bp = useMemo(() => breakingPoint(graph, shares), [graph, shares])

  const run = useTrafficRun(level, bp)
  const results = useMemo(() => evaluate(graph, shares, run.qps), [graph, shares, run.qps])
  const runState = useMemo<RunState>(
    () => ({ phase: run.phase, qps: run.qps, results, failedNodeId: run.failedNodeId }),
    [run.phase, run.qps, results, run.failedNodeId],
  )

  // ----- editing -----
  const reset = run.reset

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      if (isStructural(changes)) reset()
      onNodesChange(changes)
    },
    [onNodesChange, reset],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<FlowEdge>[]) => {
      if (isStructural(changes)) reset()
      onEdgesChange(changes)
    },
    [onEdgesChange, reset],
  )

  const onConnect = useCallback(
    (c: Connection) => {
      reset()
      setEdges((eds) => addEdge(makeFlowEdge(c.source, c.target), eds))
    },
    [reset, setEdges],
  )

  const isValidConnection = useCallback(
    (c: Connection | FlowEdge) => {
      if (!c.source || !c.target || c.source === c.target) return false
      const target = nodes.find((n) => n.id === c.target)
      if (!target || target.data.simType === 'users') return false
      return !edges.some((e) => e.source === c.source && e.target === c.target)
    },
    [nodes, edges],
  )

  const addNode = useCallback(
    (type: NodeType, position?: XYPosition) => {
      reset()
      setNodes((ns) => {
        const seq = nextSeq(ns, type)
        const pos = position ?? freeSlot(ns)
        return [...ns, makeFlowNode(`${type}-${seq}`, type, `${CATALOGUE[type].label} ${seq}`, seq, pos)]
      })
    },
    [reset, setNodes],
  )

  const selectedNode = nodes.find((n) => n.selected) ?? null
  const selectedEdge = edges.find((e) => e.selected) ?? null
  const selectionLabel = selectedNode
    ? selectedNode.deletable === false
      ? null
      : selectedNode.data.name
    : selectedEdge
      ? 'wire'
      : null

  const removeSelected = useCallback(() => {
    void deleteElements({
      nodes: selectedNode ? [{ id: selectedNode.id }] : [],
      edges: selectedEdge ? [{ id: selectedEdge.id }] : [],
    })
  }, [deleteElements, selectedNode, selectedEdge])

  const resetLevel = useCallback(() => {
    reset()
    setNodes(initial.nodes.map((n) => ({ ...n })))
    setEdges(initial.edges.map((e) => ({ ...e })))
  }, [reset, setNodes, setEdges, initial])

  // ----- verdict -----
  const failedNode = run.failedNodeId ? (graph.nodes.find((n) => n.id === run.failedNodeId) ?? null) : null
  const score = run.phase === 'passed' ? scoreOf(graph, shares, level) : null

  // ----- overlays -----
  const [introOpen, setIntroOpen] = useState(() => !introSeen())
  const closeIntro = useCallback(() => {
    markIntroSeen()
    setIntroOpen(false)
  }, [])

  // The pass modal shows once per run; dismissing it remembers which run was dismissed.
  const [dismissedRun, setDismissedRun] = useState(-1)
  const celebrating = run.phase === 'passed' && dismissedRun !== run.runId
  const closeCelebration = useCallback(() => setDismissedRun(run.runId), [run.runId])

  return (
    <RunContext.Provider value={runState}>
      <div className="app">
        <Board
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onDropType={addNode}
        >
          <RunHud
            phase={run.phase}
            qps={run.qps}
            targetQps={level.targetQps}
            blocked={errors.length > 0}
            onPlay={run.play}
            onStop={reset}
          />
        </Board>
        <Tray palette={level.palette} onAdd={addNode} />
        <LevelPanel
          level={level}
          spend={spend}
          errors={errors}
          phase={run.phase}
          failedNode={failedNode}
          breaking={bp}
          shares={shares}
          score={score}
          selectionLabel={selectionLabel}
          onRemoveSelected={removeSelected}
          onResetLevel={resetLevel}
          onShowIntro={() => setIntroOpen(true)}
        />
      </div>
      <Tutorial open={introOpen} level={level} onClose={closeIntro} />
      <SuccessModal open={celebrating} level={level} score={score} onClose={closeCelebration} />
    </RunContext.Provider>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Game />
    </ReactFlowProvider>
  )
}
