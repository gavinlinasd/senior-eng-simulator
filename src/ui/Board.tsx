import { useCallback, type DragEvent, type ReactNode } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  useReactFlow,
  type IsValidConnection,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from '@xyflow/react'
import type { NodeType } from '../sim/types'
import { DRAG_MIME, FIT_VIEW_OPTIONS, type FlowEdge, type FlowNode } from './flow'
import SimNode from './SimNode'
import TrafficEdge from './TrafficEdge'

const nodeTypes = { sim: SimNode }
const edgeTypes = { traffic: TrafficEdge }
const TRAFFIC = '#8EC5FF'
const defaultEdgeOptions = {
  type: 'traffic',
  markerEnd: { type: MarkerType.ArrowClosed, color: TRAFFIC, width: 16, height: 16 },
}
const connectionLineStyle = { stroke: 'white', strokeWidth: 2, strokeDasharray: '4 4' }
const deleteKeyCode = ['Backspace', 'Delete']

/** Rough half-size of a node card, so a dropped node lands centred on the cursor. */
const DROP_OFFSET = { x: 110, y: 36 }

interface BoardProps {
  nodes: FlowNode[]
  edges: FlowEdge[]
  onNodesChange: OnNodesChange<FlowNode>
  onEdgesChange: OnEdgesChange<FlowEdge>
  onConnect: OnConnect
  isValidConnection: IsValidConnection<FlowEdge>
  onDropType: (type: NodeType, position: XYPosition) => void
  children?: ReactNode
}

export function Board({ nodes, edges, onNodesChange, onEdgesChange, onConnect, isValidConnection, onDropType, children }: BoardProps) {
  const { screenToFlowPosition } = useReactFlow()

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData(DRAG_MIME) as NodeType | ''
      if (!type) return
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      onDropType(type, { x: p.x - DROP_OFFSET.x, y: p.y - DROP_OFFSET.y })
    },
    [screenToFlowPosition, onDropType],
  )

  return (
    <div className="board">
      <ReactFlow<FlowNode, FlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onDragOver={onDragOver}
        onDrop={onDrop}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={connectionLineStyle}
        deleteKeyCode={deleteKeyCode}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={0.4}
        maxZoom={1.5}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Lines} gap={24} color="rgba(255,255,255,0.07)" />
        <Controls showInteractive={false} />
        {children}
      </ReactFlow>
    </div>
  )
}
