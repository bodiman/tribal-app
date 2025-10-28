import type { Graph, Node, Edge } from './schema';
import { createNode, createEdge, createGraph } from './schema';

export class TribalDSLParser {
  static parseToGraph(dsl: string): Graph {
    const lines = dsl.split('\n').map(line => line.trim()).filter(line => line);
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeSet = new Set<string>();
    let currentMarkupNode: string | null = null;
    let markupLines: string[] = [];

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line) continue;

      // Handle markup blocks: @NodeId { markup: "..." }
      if (line.startsWith('@')) {
        if (currentMarkupNode) {
          // Finish previous markup block
          this.applyMarkupToNode(nodes, currentMarkupNode, markupLines.join('\n'));
        }

        const match = line.match(/^@(\w+)\s*\{/);
        if (match) {
          currentMarkupNode = match[1];
          markupLines = [];
          
          // Check if markup is on same line
          const sameLineMatch = line.match(/markup:\s*"([^"]*)"/);
          if (sameLineMatch) {
            markupLines.push(sameLineMatch[1]);
            if (line.includes('}')) {
              this.applyMarkupToNode(nodes, currentMarkupNode, markupLines.join('\n'));
              currentMarkupNode = null;
              markupLines = [];
            }
          }
        }
        continue;
      }

      // Handle markup content inside blocks
      if (currentMarkupNode) {
        if (line === '}') {
          this.applyMarkupToNode(nodes, currentMarkupNode, markupLines.join('\n'));
          currentMarkupNode = null;
          markupLines = [];
        } else {
          // Extract markup content
          const markupMatch = line.match(/markup:\s*"([^"]*)"/);
          if (markupMatch) {
            markupLines.push(markupMatch[1]);
          } else {
            markupLines.push(line);
          }
        }
        continue;
      }

      // Parse edge definitions: (A) -> (B): label
      const edgeMatch = line.match(/\(([^)]+)\)\s*(->|<->|--)\s*\(([^)]+)\)(?::\s*(.+))?/);
      if (edgeMatch) {
        const [, sourceId, arrow, targetId, label] = edgeMatch;
        const directed = arrow === '->';
        const bidirectional = arrow === '<->';

        // Add nodes if they don't exist
        if (!nodeSet.has(sourceId)) {
          nodes.push(this.createDefaultNode(sourceId, nodes.length));
          nodeSet.add(sourceId);
        }
        if (!nodeSet.has(targetId)) {
          nodes.push(this.createDefaultNode(targetId, nodes.length));
          nodeSet.add(targetId);
        }

        // Add edge
        const edgeId = `E${edges.length + 1}`;
        edges.push(createEdge(edgeId, sourceId, targetId, directed, label?.trim()));

        // Add reverse edge for bidirectional
        if (bidirectional) {
          const reverseEdgeId = `E${edges.length + 1}`;
          edges.push(createEdge(reverseEdgeId, targetId, sourceId, directed, label?.trim()));
        }
      }
    }

    // Finish any remaining markup block
    if (currentMarkupNode) {
      this.applyMarkupToNode(nodes, currentMarkupNode, markupLines.join('\n'));
    }

    return createGraph(nodes, edges);
  }

  private static createDefaultNode(id: string, index: number): Node {
    return createNode(
      id,
      id,
      { x: (index % 4) * 200 + 100, y: Math.floor(index / 4) * 150 + 100 }
    );
  }

  private static applyMarkupToNode(nodes: Node[], nodeId: string, markup: string): void {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      node.markup = markup.trim();
    }
  }

  static graphToDSL(graph: Graph): string {
    const lines: string[] = [];
    
    // Add title comment
    lines.push('# Tribal Graph');
    lines.push('');

    // Add edges
    for (const edge of graph.edges) {
      const arrow = edge.directed ? '->' : '--';
      const label = edge.label ? `: ${edge.label}` : '';
      lines.push(`(${edge.source}) ${arrow} (${edge.target})${label}`);
    }

    lines.push('');

    // Add node markup blocks
    for (const node of graph.nodes) {
      if (node.markup) {
        lines.push(`@${node.id} {`);
        lines.push(`  markup: "${node.markup}"`);
        lines.push('}');
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}