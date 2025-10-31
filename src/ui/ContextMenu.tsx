import React, { useEffect, useRef } from 'react';
import type { Node } from '../core/schema';

interface ContextMenuProps {
  x: number;
  y: number;
  isVisible: boolean;
  onClose: () => void;
  onAddNode?: () => void;
  onStartDirectedEdge?: () => void;
  onStartUndirectedEdge?: () => void;
  contextNode?: Node | null;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  isVisible,
  onClose,
  onAddNode,
  onStartDirectedEdge,
  onStartUndirectedEdge,
  contextNode,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Element)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const handleAddNode = () => {
    if (onAddNode) {
      onAddNode();
      onClose();
    }
  };

  const handleStartDirectedEdge = () => {
    if (onStartDirectedEdge) {
      onStartDirectedEdge();
      onClose();
    }
  };

  const handleStartUndirectedEdge = () => {
    if (onStartUndirectedEdge) {
      onStartUndirectedEdge();
      onClose();
    }
  };

  const isNodeContext = contextNode !== null && contextNode !== undefined;

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50 min-w-[140px]"
      style={{
        left: x,
        top: y,
      }}
    >
      {isNodeContext ? (
        // Node context menu
        <>
          {contextNode && (
            <div className="px-4 py-1 text-xs text-gray-600 font-medium border-b border-gray-200 mb-1">
              {contextNode.label}
            </div>
          )}
          <button
            onClick={handleStartUndirectedEdge}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <span className="text-green-500">↔</span>
            Add Undirected Edge
          </button>
          <button
            onClick={handleStartDirectedEdge}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <span className="text-blue-500">→</span>
            Add Directed Edge
          </button>
          <div className="px-4 py-1 text-xs text-gray-500 border-t border-gray-200 mt-1">
            Click another node to connect
          </div>
        </>
      ) : (
        // Canvas context menu
        <>
          <button
            onClick={handleAddNode}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <span className="text-blue-500">+</span>
            Add Node
          </button>
          <hr className="my-1 border-gray-200" />
          <div className="px-4 py-1 text-xs text-gray-500">
            Right-click to add nodes
          </div>
        </>
      )}
    </div>
  );
};