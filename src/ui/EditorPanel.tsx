import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import type { Node, Edge } from '../core/schema';

interface EditorPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onNodeUpdate: (node: Node) => void;
  onEdgeUpdate: (edge: Edge) => void;
  onClose: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  selectedNode,
  selectedEdge,
  onNodeUpdate,
  onEdgeUpdate,
  onClose,
}) => {
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [markup, setMarkup] = useState('');
  const [label, setLabel] = useState('');

  // Update local state when selection changes
  useEffect(() => {
    if (selectedNode) {
      setMarkup(selectedNode.markup || '');
      setLabel(selectedNode.label);
    } else if (selectedEdge) {
      setMarkup(selectedEdge.markup || '');
      setLabel(selectedEdge.label || '');
    } else {
      setMarkup('');
      setLabel('');
    }
  }, [selectedNode, selectedEdge]);

  const handleSave = () => {
    if (selectedNode) {
      onNodeUpdate({
        ...selectedNode,
        label: label || selectedNode.label,
        markup: markup || undefined,
      });
    } else if (selectedEdge) {
      onEdgeUpdate({
        ...selectedEdge,
        label: label || undefined,
        markup: markup || undefined,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-96 bg-gray-100 border-l border-gray-300 p-4 text-center text-gray-500">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Editor Panel</h3>
          <p>Select a node or edge to edit its content</p>
        </div>
        
        <div className="text-sm space-y-2">
          <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">N</kbd> Add Node</div>
          <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">E</kbd> Add Edge</div>
          <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Del</kbd> Delete</div>
          <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Enter</kbd> Edit</div>
          <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+S</kbd> Save</div>
        </div>
      </div>
    );
  }

  const entityType = selectedNode ? 'Node' : 'Edge';
  const entityId = selectedNode?.id || selectedEdge?.id || '';

  return (
    <div className="w-96 bg-white border-l border-gray-300 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">
            Edit {entityType}: {entityId}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Label input */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter label..."
          />
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-200 rounded-md p-1">
          <button
            onClick={() => setEditorMode('edit')}
            className={`flex-1 py-1 px-3 rounded text-sm font-medium transition-colors ${
              editorMode === 'edit'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setEditorMode('preview')}
            className={`flex-1 py-1 px-3 rounded text-sm font-medium transition-colors ${
              editorMode === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {editorMode === 'edit' ? (
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={markup}
            onChange={(value) => setMarkup(value || '')}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              renderLineHighlight: 'none',
              scrollBeyondLastLine: false,
              fontSize: 14,
            }}
          />
        ) : (
          <div className="h-full overflow-auto p-4">
            <div className="prose prose-sm max-w-none">
              {markup ? (
                <ReactMarkdown>{markup}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">No markup content</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+S</kbd> to save
          </div>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};