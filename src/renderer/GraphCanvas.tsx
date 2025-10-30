import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  type Node as ReactFlowNode,
  type Edge as ReactFlowEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type EdgeChange,
  type NodeChange,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Shuffle, Layers } from 'lucide-react';

import type { Graph, Node, Edge } from '../core/schema';
import { createNode, createEdge } from '../core/schema';
import { NodeView } from './NodeView';
import { EdgeView } from './EdgeView';
import { ContextMenu } from '../ui/ContextMenu';
import { applyAutoLayout, applyForceDirectedLayout, applyHierarchicalLayout, isLayoutCluttered } from '../utils/graphLayout';

interface GraphCanvasProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
  onNodeSelect: (node: Node | null) => void;
  onEdgeSelect: (edge: Edge | null) => void;
  onNodeUpdate?: (node: Node) => void;
  onEdgeUpdate?: (edge: Edge) => void;
}

// Convert Tribal nodes to ReactFlow nodes
const convertToReactFlowNodes = (
  nodes: Node[], 
  onNodeUpdate?: (node: Node) => void
): ReactFlowNode[] => {
  return nodes.map(node => ({
    id: node.id,
    type: 'tribal',
    position: node.position,
    data: { node, onNodeUpdate },
  }));
};

// Convert Tribal edges to ReactFlow edges
const convertToReactFlowEdges = (edges: Edge[], onEdgeUpdate?: (edge: Edge) => void): ReactFlowEdge[] => {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'tribal',
    markerEnd: edge.directed ? { type: MarkerType.ArrowClosed } : undefined,
    data: { edge, onEdgeUpdate },
  }));
};

// Define node and edge types outside component to prevent re-creation
const nodeTypes = {
  tribal: NodeView,
};

const edgeTypes = {
  tribal: EdgeView,
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph,
  onGraphChange,
  onNodeSelect,
  onEdgeSelect,
  onNodeUpdate,
  onEdgeUpdate,
}) => {

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // One-time initialization of ReactFlow state from external graph
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) {
      console.log('Initializing ReactFlow nodes and edges from graph (once)');
      setNodes(convertToReactFlowNodes(graph.nodes, onNodeUpdate));
      setEdges(convertToReactFlowEdges(graph.edges, onEdgeUpdate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    isVisible: boolean;
    flowPosition?: { x: number; y: number };
    contextNode?: Node | null;
  }>({
    x: 0,
    y: 0,
    isVisible: false,
    contextNode: null,
  });

  // Track if we're currently dragging
  const isDraggingRef = useRef(false);
  // Stage updates locally to avoid parent re-renders during interactions
  const pendingGraphRef = useRef(graph);
  
  // Get React Flow instance for coordinate conversion
  const { screenToFlowPosition } = useReactFlow();

  // Rebuild ReactFlow state when structure or content changes
  useEffect(() => {
    if (nodes.length !== graph.nodes.length || edges.length !== graph.edges.length) {
      console.log(`[${performance.now().toFixed(1)}ms] GraphCanvas structural change - rebuilding nodes/edges`);
    }
    setNodes(convertToReactFlowNodes(graph.nodes, onNodeUpdate));
    setEdges(convertToReactFlowEdges(graph.edges, onEdgeUpdate));
    // Keep pending ref in sync with external graph
    pendingGraphRef.current = graph;
  }, [graph.nodes, graph.edges, setNodes, setEdges, onNodeUpdate, onEdgeUpdate]);




  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const newEdge: Edge = {
        id: `E${Date.now()}`,
        source: params.source,
        target: params.target,
        directed: true,
      };

      const updatedGraph: Graph = {
        ...graph,
        edges: [...graph.edges, newEdge],
      };

      onGraphChange(updatedGraph);
    },
    [graph, onGraphChange]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Track drag state
      const hasDragStart = changes.some(change => change.type === 'position' && change.dragging);
      const hasDragEnd = changes.some(change => change.type === 'position' && !change.dragging);

      if (hasDragStart) {
        isDraggingRef.current = true;
      }

      if (hasDragEnd) {
        isDraggingRef.current = false;
        // Commit staged updates only when interaction ends
        onGraphChange(pendingGraphRef.current);
        return;
      }

      // Stage position updates locally (no parent re-renders during interaction)
      const positionChanges = changes.filter(c => c.type === "position" && 'position' in c && c.position);
      if (positionChanges.length > 0) {
        // Update pending graph ref with current ReactFlow positions
        const externalNodes = nodes.map(n => {
          const change = positionChanges.find(ch => 'id' in ch && ch.id === n.id);
          const position = change && 'position' in change && change.position ? change.position : n.position;
          
          return {
            id: n.id,
            position: position,
            size: n.data?.node?.size || { width: 192, height: 96 },
            label: n.data?.node?.label || '',
            markup: n.data?.node?.markup,
          };
        });

        // Stage in ref without triggering parent updates
        pendingGraphRef.current = { ...pendingGraphRef.current, nodes: externalNodes };
      }
    },
    [onNodesChange, nodes, onGraphChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      // Handle edge deletions
      const removeChanges = changes.filter(change => change.type === 'remove');
      if (removeChanges.length > 0) {
        const removedIds = removeChanges.map(change => change.id);
        const updatedEdges = graph.edges.filter(edge => !removedIds.includes(edge.id));

        const updatedGraph: Graph = {
          ...graph,
          edges: updatedEdges,
        };

        onGraphChange(updatedGraph);
      }
    },
    [graph, onGraphChange, onEdgesChange]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: ReactFlowNode) => {
      const tribalNode = graph.nodes.find(n => n.id === node.id);
      onNodeSelect(tribalNode || null);
    },
    [graph.nodes, onNodeSelect]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: ReactFlowEdge) => {
      const tribalEdge = graph.edges.find(e => e.id === edge.id);
      onEdgeSelect(tribalEdge || null);
    },
    [graph.edges, onEdgeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
    onEdgeSelect(null);
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  }, [onNodeSelect, onEdgeSelect]);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    const flowPosition = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      isVisible: true,
      flowPosition,
      contextNode: null,
    });
  }, [screenToFlowPosition]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
    event.preventDefault();
    event.stopPropagation();
    
    const tribalNode = graph.nodes.find(n => n.id === node.id);
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      isVisible: true,
      contextNode: tribalNode || null,
    });
  }, [graph.nodes]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  }, []);

  const addNodeAtPosition = useCallback(() => {
    if (!contextMenu.flowPosition) return;

    const nodeCount = graph.nodes.length;
    const newNode = createNode(
      `Node${nodeCount + 1}`,
      `Node ${nodeCount + 1}`,
      contextMenu.flowPosition
    );

    const updatedGraph: Graph = {
      ...graph,
      nodes: [...graph.nodes, newNode],
    };

    onGraphChange(updatedGraph);
  }, [contextMenu.flowPosition, graph, onGraphChange]);

  const addEdgeFromNode = useCallback(() => {
    if (!contextMenu.contextNode) return;
    
    // For now, create an edge to the first available node that's not the same
    const targetNode = graph.nodes.find(node => node.id !== contextMenu.contextNode?.id);
    if (!targetNode) {
      alert('Need at least 2 nodes to create an edge');
      return;
    }

    const edgeCount = graph.edges.length;
    const newEdge = createEdge(
      `E${edgeCount + 1}`,
      contextMenu.contextNode.id,
      targetNode.id,
      false, // bidirectional edge
      'Connection'
    );

    const updatedGraph: Graph = {
      ...graph,
      edges: [...graph.edges, newEdge],
    };

    onGraphChange(updatedGraph);
  }, [contextMenu.contextNode, graph, onGraphChange]);

  const addOutgoingEdgeFromNode = useCallback(() => {
    if (!contextMenu.contextNode) return;
    
    // For now, create an edge to the first available node that's not the same
    const targetNode = graph.nodes.find(node => node.id !== contextMenu.contextNode?.id);
    if (!targetNode) {
      alert('Need at least 2 nodes to create an edge');
      return;
    }

    const edgeCount = graph.edges.length;
    const newEdge = createEdge(
      `E${edgeCount + 1}`,
      contextMenu.contextNode.id,
      targetNode.id,
      true, // directed edge
      'Flow'
    );

    const updatedGraph: Graph = {
      ...graph,
      edges: [...graph.edges, newEdge],
    };

    onGraphChange(updatedGraph);
  }, [contextMenu.contextNode, graph, onGraphChange]);

  // Layout functions
  const { getViewport } = useReactFlow();

  const applyLayout = useCallback((layoutType: 'auto' | 'force' | 'hierarchical') => {
    const layoutOptions = {
      width: Math.max(1200, window.innerWidth),
      height: Math.max(800, window.innerHeight),
      iterations: 300,
    };

    let result;
    switch (layoutType) {
      case 'force':
        result = applyForceDirectedLayout(graph.nodes, graph.edges, layoutOptions);
        break;
      case 'hierarchical':
        result = applyHierarchicalLayout(graph.nodes, graph.edges, layoutOptions);
        break;
      case 'auto':
      default:
        result = applyAutoLayout(graph.nodes, graph.edges, layoutOptions);
        break;
    }

    const updatedGraph: Graph = {
      ...graph,
      nodes: result.nodes,
      edges: result.edges,
    };

    onGraphChange(updatedGraph);
  }, [graph, onGraphChange, getViewport]);

  const handleAutoLayout = useCallback(() => {
    applyLayout('auto');
  }, [applyLayout]);

  const handleForceLayout = useCallback(() => {
    applyLayout('force');
  }, [applyLayout]);

  const handleHierarchicalLayout = useCallback(() => {
    applyLayout('hierarchical');
  }, [applyLayout]);

  // Automatically suggest layout if graph appears cluttered
  const shouldSuggestLayout = isLayoutCluttered(graph.nodes) && graph.nodes.length > 2;

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        
        {/* Layout Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {shouldSuggestLayout && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-md">
              <p className="text-sm text-yellow-800 mb-2">
                Graph appears cluttered. Try auto-layout?
              </p>
              <button
                onClick={handleAutoLayout}
                className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
              >
                Auto Layout
              </button>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2">
            <div className="text-xs text-gray-600 mb-2 font-medium">Layout</div>
            <div className="flex flex-col gap-1">
              <button
                onClick={handleAutoLayout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Automatically choose best layout"
              >
                <Shuffle className="w-4 h-4" />
                Auto Layout
              </button>
              <button
                onClick={handleForceLayout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Force-directed layout"
              >
                <Shuffle className="w-4 h-4" />
                Force Layout
              </button>
              <button
                onClick={handleHierarchicalLayout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Hierarchical layout"
              >
                <Layers className="w-4 h-4" />
                Hierarchical
              </button>
            </div>
          </div>
        </div>
      </ReactFlow>
      
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isVisible={contextMenu.isVisible}
        onClose={closeContextMenu}
        onAddNode={addNodeAtPosition}
        onAddEdge={addEdgeFromNode}
        onAddOutgoingEdge={addOutgoingEdgeFromNode}
        contextNode={contextMenu.contextNode}
      />
    </div>
  );
};