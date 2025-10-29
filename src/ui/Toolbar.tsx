import React, { useRef } from 'react';
import type { Graph } from '../core/schema';
import { createNode, createEdge } from '../core/schema';
import { GraphSerializer } from '../core/serializer';
import { TribalDSLParser } from '../core/parser';
import { useAuth } from '../contexts/AuthContext';

interface ToolbarProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
  onNewGraph: () => void;
  onShowAuth?: () => void;
  userMenu?: React.ReactNode;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  graph,
  onGraphChange,
  onNewGraph,
  onShowAuth,
  userMenu,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();

  const addNode = () => {
    const nodeCount = graph.nodes.length;
    const newNode = createNode(
      `Node${nodeCount + 1}`,
      `Node ${nodeCount + 1}`,
      {
        x: (nodeCount % 4) * 200 + 100,
        y: Math.floor(nodeCount / 4) * 150 + 100,
      }
    );

    const updatedGraph: Graph = {
      ...graph,
      nodes: [...graph.nodes, newNode],
    };

    onGraphChange(updatedGraph);
  };

  const addEdge = () => {
    if (graph.nodes.length < 2) {
      alert('Need at least 2 nodes to create an edge');
      return;
    }

    const edgeCount = graph.edges.length;
    const sourceNode = graph.nodes[0];
    const targetNode = graph.nodes[1];

    const newEdge = createEdge(
      `E${edgeCount + 1}`,
      sourceNode.id,
      targetNode.id,
      true,
      `Edge ${edgeCount + 1}`
    );

    const updatedGraph: Graph = {
      ...graph,
      edges: [...graph.edges, newEdge],
    };

    onGraphChange(updatedGraph);
  };

  const saveGraph = () => {
    const filename = `tribal-graph-${Date.now()}.json`;
    GraphSerializer.saveToFile(graph, filename);
  };

  const loadGraph = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const loadedGraph = await GraphSerializer.loadFromFile(file);
        onGraphChange(loadedGraph);
      } catch (error) {
        alert(`Failed to load graph: ${error}`);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportDSL = () => {
    const dsl = TribalDSLParser.graphToDSL(graph);
    const blob = new Blob([dsl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tribal-graph-${Date.now()}.tribal`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center space-x-1">
        <h1 className="text-xl font-bold text-gray-800 mr-4">Tribal</h1>
        
        {/* File operations */}
        <div className="flex items-center space-x-1 mr-4 border-r border-gray-300 pr-4">
          <button
            onClick={onNewGraph}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="New Graph"
          >
            New
          </button>
          <button
            onClick={loadGraph}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Load Graph"
          >
            Load
          </button>
          <button
            onClick={saveGraph}
            className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            title="Save Graph"
          >
            Save
          </button>
        </div>

        {/* Edit operations */}
        <div className="flex items-center space-x-1 mr-4 border-r border-gray-300 pr-4">
          <button
            onClick={addNode}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            title="Add Node (N)"
          >
            + Node
          </button>
          <button
            onClick={addEdge}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            title="Add Edge (E)"
          >
            + Edge
          </button>
        </div>

        {/* Export operations */}
        <div className="flex items-center space-x-1">
          <button
            onClick={exportDSL}
            className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            title="Export as DSL"
          >
            Export DSL
          </button>
        </div>
      </div>

      {/* Stats and Auth */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-4 text-sm text-gray-600 mr-4">
          <span>{graph.nodes.length} nodes</span>
          <span>{graph.edges.length} edges</span>
        </div>
        
        {/* Cloud Sync Button */}
        {isAuthenticated && (
          <button
            onClick={() => {
              // TODO: Implement cloud sync
              console.log('Cloud sync not implemented yet');
            }}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Sync with Cloud"
          >
            📡 Sync
          </button>
        )}
        
        {/* Auth Section */}
        {isAuthenticated ? (
          userMenu
        ) : (
          <button
            onClick={onShowAuth}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        className="hidden"
      />
    </div>
  );
};