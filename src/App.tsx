import { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';

import type { Graph, Node, Edge } from './core';
import { createGraph, createNode } from './core';
import { GraphCanvas } from './renderer';
import { EditorPanel, Toolbar } from './ui';
import { GraphPersistence } from './core/serializer';

// Sample graph for demo
const createSampleGraph = (): Graph => {
  const userNode = createNode('User', 'User', { x: 100, y: 100 }, '### User\nInitiates login process');
  const frontendNode = createNode('Frontend', 'Frontend', { x: 300, y: 100 }, '### Frontend\nReact application');
  const apiNode = createNode('API', 'API Server', { x: 500, y: 100 }, '### API Server\nHandles authentication');
  
  return createGraph(
    [userNode, frontendNode, apiNode],
    [
      { id: 'E1', source: 'User', target: 'Frontend', directed: true, label: 'Interacts' },
      { id: 'E2', source: 'Frontend', target: 'API', directed: true, label: 'Requests', markup: '**HTTP POST** /auth/login' },
    ]
  );
};

function App() {
  const [graph, setGraph] = useState<Graph>(createSampleGraph());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [persistence] = useState(() => new GraphPersistence());

  // Auto-save to IndexedDB
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      persistence.saveGraph('autosave', graph);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [graph, persistence]);

  // Load autosave on mount
  useEffect(() => {
    persistence.loadGraph('autosave').then(savedGraph => {
      if (savedGraph) {
        setGraph(savedGraph);
      }
    }).catch(console.error);
  }, [persistence]);

  const handleGraphChange = useCallback((newGraph: Graph) => {
    setGraph(newGraph);
  }, []);

  const handleNodeUpdate = useCallback((updatedNode: Node) => {
    const start = performance.now();
    console.log(`[${start.toFixed(1)}ms] App handleNodeUpdate called for node:`, updatedNode.id);
    console.log('App handleNodeUpdate - incoming node:', updatedNode);
    
    setGraph(prevGraph => {
      const newGraph = {
        ...prevGraph,
        nodes: prevGraph.nodes.map(node =>
          node.id === updatedNode.id ? updatedNode : node
        ),
      };
      console.log('App handleNodeUpdate - new graph nodes:', newGraph.nodes);
      return newGraph;
    });
    
    setSelectedNode(updatedNode);
    const end = performance.now();
    console.log(`[${end.toFixed(1)}ms] App handleNodeUpdate took ${(end - start).toFixed(1)}ms`);
  }, []);

  const handleEdgeUpdate = useCallback((updatedEdge: Edge) => {
    setGraph(prevGraph => ({
      ...prevGraph,
      edges: prevGraph.edges.map(edge =>
        edge.id === updatedEdge.id ? updatedEdge : edge
      ),
    }));
    setSelectedEdge(updatedEdge);
  }, []);

  const handleNewGraph = useCallback(() => {
    const confirmNew = window.confirm('Create a new graph? This will clear the current graph.');
    if (confirmNew) {
      setGraph(createGraph());
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Helper function to detect if user is in an editing context
  const isInEditingContext = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false;
    
    // Standard form inputs
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return true;
    }
    
    // ContentEditable elements (Monaco Editor uses these)
    if (target instanceof HTMLElement && target.isContentEditable) {
      return true;
    }
    
    // Check if inside Monaco Editor
    if (target.closest('.monaco-editor')) {
      return true;
    }
    
    // Check for elements with textbox role
    if (target.getAttribute('role') === 'textbox') {
      return true;
    }
    
    // Check if parent elements are editable contexts
    const editableParent = target.closest('[contenteditable="true"], .monaco-editor, input, textarea');
    if (editableParent) {
      return true;
    }
    
    return false;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in any editing context
      if (isInEditingContext(e.target)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            // Add node logic is in Toolbar component
          }
          break;
        case 'e':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            // Add edge logic is in Toolbar component
          }
          break;
        case 'delete':
        case 'backspace':
          if (selectedNode) {
            const updatedGraph = {
              ...graph,
              nodes: graph.nodes.filter(node => node.id !== selectedNode.id),
              edges: graph.edges.filter(edge => 
                edge.source !== selectedNode.id && edge.target !== selectedNode.id
              ),
            };
            setGraph(updatedGraph);
            setSelectedNode(null);
          } else if (selectedEdge) {
            const updatedGraph = {
              ...graph,
              edges: graph.edges.filter(edge => edge.id !== selectedEdge.id),
            };
            setGraph(updatedGraph);
            setSelectedEdge(null);
          }
          break;
        case 'enter':
          // Editor panel handles this
          break;
        case 'escape':
          setSelectedNode(null);
          setSelectedEdge(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graph, selectedNode, selectedEdge]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Toolbar
        graph={graph}
        onGraphChange={handleGraphChange}
        onNewGraph={handleNewGraph}
      />
      
      <div className="flex flex-1 min-h-0">
        <div className="flex-1">
          <ReactFlowProvider>
            <GraphCanvas
              graph={graph}
              onGraphChange={handleGraphChange}
              onNodeSelect={setSelectedNode}
              onEdgeSelect={setSelectedEdge}
              onNodeUpdate={handleNodeUpdate}
              onEdgeUpdate={handleEdgeUpdate}
            />
          </ReactFlowProvider>
        </div>
        
        <EditorPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodeUpdate={handleNodeUpdate}
          onEdgeUpdate={handleEdgeUpdate}
          onClose={handleCloseEditor}
        />
      </div>
    </div>
  );
}

export default App;
