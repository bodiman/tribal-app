import {
  forceSimulation,
  forceLink,
  forceCenter,
  forceManyBody,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Node, Edge } from '../core/schema';

interface LayoutNode extends SimulationNodeDatum {
  id: string;
  originalNode: Node;
}

interface LayoutEdge extends SimulationLinkDatum<LayoutNode> {
  originalEdge: Edge;
}

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

export interface LayoutOptions {
  width?: number;
  height?: number;
  iterations?: number;
  nodeSpacing?: number;
  linkDistance?: number;
  linkStrength?: number;
  repulsionStrength?: number;
  centerStrength?: number;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  width: 1200,
  height: 800,
  iterations: 300,
  nodeSpacing: 100,
  linkDistance: 200,
  linkStrength: 0.1,
  repulsionStrength: -1000,
  centerStrength: 0.1,
};

/**
 * Apply force-directed layout to a graph using D3's force simulation
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges  
 * @param options - Layout configuration options
 * @returns New node and edge arrays with updated positions
 */
export function applyForceDirectedLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Convert to D3 simulation format
  const layoutNodes: LayoutNode[] = nodes.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    originalNode: node,
  }));

  const layoutEdges: LayoutEdge[] = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    originalEdge: edge,
  }));

  // Create force simulation
  const simulation = forceSimulation(layoutNodes)
    .force('link', forceLink(layoutEdges)
      .id((d: any) => d.id)
      .distance(opts.linkDistance)
      .strength(opts.linkStrength)
    )
    .force('charge', forceManyBody()
      .strength(opts.repulsionStrength)
    )
    .force('center', forceCenter(opts.width / 2, opts.height / 2)
      .strength(opts.centerStrength)
    )
    .force('collision', forceCollide()
      .radius(opts.nodeSpacing)
      .strength(0.7)
    );

  // Run simulation synchronously
  simulation.stop();
  for (let i = 0; i < opts.iterations; i++) {
    simulation.tick();
  }

  // Convert back to original format with updated positions
  const updatedNodes: Node[] = layoutNodes.map(layoutNode => ({
    ...layoutNode.originalNode,
    position: {
      x: layoutNode.x || 0,
      y: layoutNode.y || 0,
    },
  }));

  return {
    nodes: updatedNodes,
    edges,
  };
}

/**
 * Apply hierarchical layout for tree-like graphs
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @param options - Layout configuration options
 * @returns New node and edge arrays with hierarchical positioning
 */
export function applyHierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Find root nodes (nodes with no incoming edges)
  const incomingEdges = new Set(edges.map(e => e.target));
  const rootNodes = nodes.filter(node => !incomingEdges.has(node.id));

  // If no clear root, use the first node
  if (rootNodes.length === 0 && nodes.length > 0) {
    rootNodes.push(nodes[0]);
  }

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  }

  // Assign levels using BFS
  const levels = new Map<string, number>();
  const queue: { nodeId: string; level: number }[] = [];

  // Start with root nodes at level 0
  for (const root of rootNodes) {
    levels.set(root.id, 0);
    queue.push({ nodeId: root.id, level: 0 });
  }

  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    const children = adjacency.get(nodeId) || [];

    for (const childId of children) {
      if (!levels.has(childId)) {
        levels.set(childId, level + 1);
        queue.push({ nodeId: childId, level: level + 1 });
      }
    }
  }

  // Group nodes by level
  const nodesByLevel = new Map<number, Node[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  }

  // Position nodes
  const updatedNodes: Node[] = [];
  const levelHeight = 250;
  const nodeWidth = 300;

  for (const [level, levelNodes] of nodesByLevel) {
    const y = level * levelHeight;
    const totalWidth = (levelNodes.length - 1) * nodeWidth;
    const startX = (opts.width - totalWidth) / 2;

    levelNodes.forEach((node, index) => {
      updatedNodes.push({
        ...node,
        position: {
          x: startX + index * nodeWidth,
          y,
        },
      });
    });
  }

  return {
    nodes: updatedNodes,
    edges,
  };
}

/**
 * Detect if a graph has a hierarchical structure
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @returns True if graph appears to be hierarchical/tree-like
 */
export function isHierarchicalGraph(nodes: Node[], edges: Edge[]): boolean {
  if (edges.length === 0) return false;

  // Check if graph is acyclic (no cycles = tree-like)
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  }

  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check for cycles starting from any unvisited node
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) return false;
    }
  }

  return true;
}

/**
 * Automatically choose the best layout algorithm for a graph
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @param options - Layout configuration options
 * @returns New node and edge arrays with optimal positioning
 */
export function applyAutoLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): LayoutResult {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  if (nodes.length === 1) {
    // Single node - center it
    const opts = { ...DEFAULT_OPTIONS, ...options };
    return {
      nodes: [{
        ...nodes[0],
        position: { x: opts.width / 2, y: opts.height / 2 }
      }],
      edges,
    };
  }

  // Choose layout algorithm based on graph structure
  if (isHierarchicalGraph(nodes, edges)) {
    return applyHierarchicalLayout(nodes, edges, options);
  } else {
    return applyForceDirectedLayout(nodes, edges, options);
  }
}

/**
 * Check if the current layout appears cluttered
 * @param nodes - Array of graph nodes
 * @returns True if nodes appear to be overlapping or too close
 */
export function isLayoutCluttered(nodes: Node[]): boolean {
  if (nodes.length < 2) return false;

  const minDistance = 150; // Minimum distance between node centers
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      
      const dx = nodeA.position.x - nodeB.position.x;
      const dy = nodeA.position.y - nodeB.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        return true;
      }
    }
  }
  
  return false;
}