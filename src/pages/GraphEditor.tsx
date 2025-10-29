import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { ArrowLeft, Save, Share } from 'lucide-react';
import toast from 'react-hot-toast';

import type { Graph, Node, Edge } from '../core';
import { createGraph, createNode } from '../core';
import { GraphCanvas } from '../renderer';
import { EditorPanel } from '../ui';
import { GraphPersistence } from '../core/serializer';
import { apiClient } from '../services/api';

// Sample graph for new graphs
const createSampleGraph = (): Graph => {
  const userNode = createNode('User', 'User', { x: 100, y: 100 }, '### User\\nInitiates login process');
  const frontendNode = createNode('Frontend', 'Frontend', { x: 300, y: 100 }, '### Frontend\\nReact application');
  const apiNode = createNode('API', 'API Server', { x: 500, y: 100 }, '### API Server\\nHandles authentication');
  
  return createGraph(
    [userNode, frontendNode, apiNode],
    [
      { id: 'E1', source: 'User', target: 'Frontend', directed: true, label: 'Interacts' },
      { id: 'E2', source: 'Frontend', target: 'API', directed: true, label: 'Requests', markup: '**HTTP POST** /auth/login' },
    ]
  );
};

export function GraphEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [graph, setGraph] = useState<Graph>(createSampleGraph());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [persistence] = useState(() => new GraphPersistence());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [graphTitle, setGraphTitle] = useState('Untitled Graph');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load graph data
  useEffect(() => {
    if (id && id !== 'new') {
      loadGraph(id);
    } else if (id === 'new') {
      // Start with sample graph for new graphs
      setGraph(createSampleGraph());
    } else {
      // Load from localStorage for legacy support
      loadAutosave();
    }
  }, [id]);

  // Auto-save functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (id && id !== 'new') {
        // Auto-save to server for existing graphs
        saveGraph(false);
      } else {
        // Auto-save to localStorage for new graphs
        persistence.saveGraph('autosave', graph);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [graph, id]);

  const loadGraph = async (graphId: string) => {
    try {
      setIsLoading(true);
      const loadedGraph = await apiClient.getGraph(graphId);
      setGraph(loadedGraph);
      setGraphTitle(loadedGraph.title || 'Untitled Graph');
    } catch (error) {
      console.error('Failed to load graph:', error);
      toast.error('Failed to load graph');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutosave = async () => {
    try {
      const savedGraph = await persistence.loadGraph('autosave');
      if (savedGraph) {
        setGraph(savedGraph);
      }
    } catch (error) {
      console.error('Failed to load autosave:', error);
    }
  };

  const saveGraph = async (showToast = true) => {
    try {
      setIsSaving(true);
      
      if (!id || id === 'new') {
        // Create new graph
        const newGraph = await apiClient.createGraph({
          title: graphTitle,
          description: `Graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges`,
          nodes: graph.nodes,
          edges: graph.edges,
          metadata: graph.metadata || {},
          is_public: false
        });
        
        // Redirect to the new graph's editor
        navigate(`/graph/${newGraph.id}`, { replace: true });
        if (showToast) {
          toast.success('Graph created');
        }
        return;
      }

      // Update existing graph
      await apiClient.updateGraph(id, {
        title: graphTitle,
        nodes: graph.nodes,
        edges: graph.edges,
        metadata: graph.metadata,
        message: 'Auto-save'
      });
      setLastSaved(new Date());
      if (showToast) {
        toast.success('Graph saved');
      }
    } catch (error) {
      console.error('Failed to save graph:', error);
      if (showToast) {
        toast.error('Failed to save graph');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleGraphChange = useCallback((newGraph: Graph) => {
    setGraph(newGraph);
  }, []);

  const handleNodeUpdate = useCallback((updatedNode: Node) => {
    const start = performance.now();
    console.log(`[${start.toFixed(1)}ms] GraphEditor handleNodeUpdate called for node:`, updatedNode.id);
    
    setGraph(prevGraph => {
      const newGraph = {
        ...prevGraph,
        nodes: prevGraph.nodes.map(node =>
          node.id === updatedNode.id ? updatedNode : node
        ),
      };
      return newGraph;
    });
    
    setSelectedNode(updatedNode);
    const end = performance.now();
    console.log(`[${end.toFixed(1)}ms] GraphEditor handleNodeUpdate took ${(end - start).toFixed(1)}ms`);
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


  const handleCloseEditor = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Helper function to detect if user is in an editing context
  const isInEditingContext = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false;
    
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return true;
    }
    
    if (target instanceof HTMLElement && target.isContentEditable) {
      return true;
    }
    
    if (target.closest('.monaco-editor')) {
      return true;
    }
    
    if (target.getAttribute('role') === 'textbox') {
      return true;
    }
    
    const editableParent = target.closest('[contenteditable=\"true\"], .monaco-editor, input, textarea');
    if (editableParent) {
      return true;
    }
    
    return false;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInEditingContext(e.target)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            saveGraph();
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
        case 'escape':
          setSelectedNode(null);
          setSelectedEdge(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graph, selectedNode, selectedEdge, saveGraph, isInEditingContext]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Editor Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            
            <div className="h-4 w-px bg-gray-300"></div>
            
            <input
              type="text"
              value={graphTitle}
              onChange={(e) => setGraphTitle(e.target.value)}
              className="text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0"
              placeholder="Graph title..."
            />
          </div>

          <div className="flex items-center space-x-3">
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <button
              onClick={() => saveGraph()}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
            
            <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200">
              <Share className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
      
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