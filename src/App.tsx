import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { carryInto } from './sim/carry'
import { CATALOGUE, costOf } from './sim/catalogue'
import { ALL_PUBLIC, breakingPoint, evaluate } from './sim/engine'
import { score as scoreOf } from './sim/score'
import type { Graph, NodeType } from './sim/types'
import { validate } from './sim/validate'
import { Board } from './ui/Board'
import { introFor } from './ui/defaultIntro'
import {
  FIT_VIEW_OPTIONS,
  fromLevel,
  makeFlowEdge,
  makeFlowNode,
  nextSeq,
  toGraph,
  type FlowEdge,
  type FlowNode,
} from './ui/flow'
import { introSeen, markIntroSeen } from './ui/intro'
import { LevelPanel } from './ui/LevelPanel'
import { LevelPickerModal } from './ui/LevelPickerModal'
import { RunContext, type RunState } from './ui/RunContext'
import { RunHud } from './ui/RunHud'
import { SuccessModal } from './ui/SuccessModal'
import { Tray } from './ui/Tray'
import { Tutorial } from './ui/Tutorial'
import { useTrafficRun, type Outcome } from './ui/useTrafficRun'

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

/**
 * Whether to open a level's walkthrough on entry. A one-page intro shows every
 * time the level is entered; a guided multi-step tutorial only until dismissed.
 */
function tourStartFor(levelIndex: number): number | null {
  const level = LEVELS[levelIndex]
  const guided = introFor(level).length > 1
  return guided && introSeen(level.id) ? null : 0
}

function Game() {
  const [levelIndex, setLevelIndex] = useState(0)
  const level = LEVELS[levelIndex]
  const hasNext = levelIndex < LEVELS.length - 1

  /** The board the current level was entered with. Reset level goes back to it. */
  const [entryBoard, setEntryBoard] = useState<Graph>(level.start)
  const [initial] = useState(() => fromLevel(level.start))
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(initial.edges)
  const { deleteElements, fitView } = useReactFlow()

  useEffect(() => {
    document.title = `Senior Eng Simulator · Level ${level.id}: ${level.title}`
  }, [level])

  // Derived sim state. The graph changes identity on every drag frame, so the
  // breaking-point scan (a few hundred evaluations) is keyed on the structure
  // alone; everything else is cheap enough to recompute.
  const graph = useMemo(() => toGraph(nodes, edges), [nodes, edges])
  const traffic = level.traffic ?? ALL_PUBLIC
  const structure =
    nodes.map((n) => `${n.id}:${n.data.simType}`).join(',') + '|' + edges.map((e) => `${e.source}>${e.target}`).join(',')
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `structure` captures everything the scan depends on
  const bp = useMemo(() => breakingPoint(graph, traffic, level.targetQps), [structure, traffic, level.targetQps])
  const errors = useMemo(() => validate(graph, level), [graph, level])
  const spend = costOf(graph)

  // ----- walkthrough -----
  // Index of the current step, or null when closed. A ref mirrors it so run
  // callbacks (which fire from animation frames) can read the latest value.
  const [tourIndex, setTourIndexState] = useState<number | null>(() => tourStartFor(0))
  const tourRef = useRef(tourIndex)
  const setTourIndex = useCallback((i: number | null) => {
    tourRef.current = i
    setTourIndexState(i)
  }, [])
  const tourSteps = useMemo(() => introFor(level), [level])
  const closeTour = useCallback(() => {
    markIntroSeen(level.id)
    setTourIndex(null)
  }, [level.id, setTourIndex])
  const tourNext = useCallback(() => {
    const i = tourRef.current
    if (i === null) return
    if (i + 1 >= tourSteps.length) closeTour()
    else setTourIndex(i + 1)
  }, [tourSteps.length, closeTour, setTourIndex])
  const tourBack = useCallback(() => {
    const i = tourRef.current
    if (i !== null && i > 0) setTourIndex(i - 1)
  }, [setTourIndex])

  const onOutcome = useCallback(
    (outcome: Outcome) => {
      const i = tourRef.current
      if (i === null) return
      if (outcome === 'passed') closeTour()
      else if (tourSteps[i]?.advance === 'failed') tourNext()
    },
    [tourSteps, closeTour, tourNext],
  )

  const run = useTrafficRun(level, bp, onOutcome)
  const results = useMemo(() => evaluate(graph, run.qps, traffic), [graph, run.qps, traffic])
  const showClasses = traffic.private > 0 || traffic.write > 0
  const runState = useMemo<RunState>(
    () => ({ phase: run.phase, qps: run.qps, results, failedNodeId: run.failedNodeId, showClasses }),
    [run.phase, run.qps, results, run.failedNodeId, showClasses],
  )

  // The pass modal shows once per run; dismissing it remembers which run was dismissed.
  const [dismissedRun, setDismissedRun] = useState(-1)
  const celebrating = run.phase === 'passed' && dismissedRun !== run.runId
  const closeCelebration = useCallback(() => setDismissedRun(run.runId), [run.runId])

  // ----- levels -----
  const reset = run.reset

  const enterLevel = useCallback(
    (index: number, board: Graph, withIntro: boolean) => {
      const start = fromLevel(board)
      reset()
      setLevelIndex(index)
      setEntryBoard(board)
      setNodes(start.nodes)
      setEdges(start.edges)
      void fitView(FIT_VIEW_OPTIONS)
      setTourIndex(withIntro ? tourStartFor(index) : null)
    },
    [reset, setNodes, setEdges, fitView, setTourIndex],
  )

  /** Jump to a level with its own fresh board. */
  const loadLevel = useCallback((index: number) => enterLevel(index, LEVELS[index].start, true), [enterLevel])
  /** Back to the board this level was entered with. No intro again. */
  const resetLevel = useCallback(() => enterLevel(levelIndex, entryBoard, false), [enterLevel, levelIndex, entryBoard])
  /** Advance, carrying the current board into the next level. */
  const nextLevel = useCallback(() => {
    if (hasNext) enterLevel(levelIndex + 1, carryInto(graph, LEVELS[levelIndex + 1]), true)
  }, [hasNext, enterLevel, levelIndex, graph])

  const [pickerOpen, setPickerOpen] = useState(false)

  // ----- editing -----
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

  // ----- verdict -----
  const failedNode = run.failedNodeId ? (graph.nodes.find((n) => n.id === run.failedNodeId) ?? null) : null
  const failedLoad = failedNode && bp ? evaluate(graph, bp.qps, traffic)[failedNode.id] : null
  const score = run.phase === 'passed' ? scoreOf(graph, level) : null

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
            traffic={level.traffic}
            blocked={errors.length > 0}
            onPlay={run.play}
            onStop={reset}
          />
        </Board>
        <Tray palette={level.palette} introduces={level.introduces ?? []} onAdd={addNode} />
        <LevelPanel
          level={level}
          spend={spend}
          errors={errors}
          phase={run.phase}
          failedNode={failedNode}
          failedLoad={failedLoad}
          breaking={bp}
          score={score}
          selectionLabel={selectionLabel}
          onRemoveSelected={removeSelected}
          onResetLevel={resetLevel}
          onShowIntro={() => setTourIndex(0)}
          hasNext={hasNext}
          onNext={nextLevel}
          onOpenPicker={() => setPickerOpen(true)}
        />
      </div>
      <Tutorial steps={tourSteps} index={tourIndex} onNext={tourNext} onBack={tourBack} onClose={closeTour} />
      <LevelPickerModal
        open={pickerOpen}
        current={levelIndex}
        onPick={loadLevel}
        onClose={() => setPickerOpen(false)}
      />
      <SuccessModal
        open={celebrating}
        level={level}
        score={score}
        hasNext={hasNext}
        onNext={nextLevel}
        onClose={closeCelebration}
      />
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
