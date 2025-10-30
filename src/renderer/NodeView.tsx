import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import ReactMarkdown from 'react-markdown';
import type { Node } from '../core/schema';

import '@reactflow/node-resizer/dist/style.css';

interface NodeData {
  node: Node;
  onNodeUpdate?: (updatedNode: Node) => void;
}

export const NodeView: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  const { node, onNodeUpdate } = data;
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editLabel, setEditLabel] = useState(node.label);
  const [editMarkup, setEditMarkup] = useState(node.markup || '');
  const [localSize, setLocalSize] = useState(node.size ?? { width: 192, height: 96 });
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus input/textarea when entering edit mode
  useEffect(() => {
    if (isEditingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingLabel]);

  useEffect(() => {
    if (isEditingInfo && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditingInfo]);

  // Reset edit values when node changes (but not while actively editing)
  useEffect(() => {
    if (!isEditingLabel) {
      setEditLabel(node.label);
    }
    if (!isEditingInfo) {
      setEditMarkup(node.markup || '');
    }
  }, [node.label, node.markup, isEditingLabel, isEditingInfo]);

  // Sync local size with node size
  useEffect(() => {
    if (node.size) {
      setLocalSize(node.size);
    }
  }, [node.size]);

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingLabel(true);
  };

  const handleInfoDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingInfo(true);
  };

  const handleLabelSave = () => {
    if (onNodeUpdate && editLabel.trim() && editLabel !== node.label) {
      onNodeUpdate({
        ...node,
        label: editLabel.trim(),
      });
    }
    setIsEditingLabel(false);
  };

  const handleInfoSave = () => {
    if (onNodeUpdate && editMarkup !== node.markup) {
      const trimmedMarkup = editMarkup.trim() || undefined;
      onNodeUpdate({
        ...node,
        markup: trimmedMarkup,
      });
      setEditMarkup(trimmedMarkup || '');
    }
    setIsEditingInfo(false);
  };

  const handleLabelCancel = () => {
    setEditLabel(node.label);
    setIsEditingLabel(false);
  };

  const handleInfoCancel = () => {
    setEditMarkup(node.markup || '');
    setIsEditingInfo(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLabelSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleLabelCancel();
    }
  };

  const handleInfoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleInfoSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleInfoCancel();
    }
  };

  const handleLabelBlur = () => {
    handleLabelSave();
  };

  const handleInfoBlur = () => {
    handleInfoSave();
  };

  const nodeRef = useRef<HTMLDivElement>(null);

  // Memoize NodeResizer props to prevent re-initialization overhead
  const resizerProps = useMemo(() => ({
    color: "transparent",
    isVisible: selected,
    minWidth: 192,
    minHeight: 96,
    handleStyle: { 
      width: '16px',
      height: '16px',
      backgroundColor: 'transparent',
      border: 'none',
    },
    lineStyle: { 
      borderColor: 'transparent', 
      borderWidth: '0px',
    },
    handleClassName: "nodrag",
    lineClassName: "nodrag",
  }), [selected]);

  return (
    <div
      ref={nodeRef}
      className={`
        border-2 shadow-md min-w-48 max-w-none relative rounded-lg overflow-visible flex flex-col
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
        ${isEditingLabel || isEditingInfo ? 'border-blue-400 shadow-lg' : ''}
        hover:shadow-lg
        transition-all duration-200
      `}
      style={{
        width: localSize.width,
        height: localSize.height,
        minWidth: '12rem',
        minHeight: '6rem',
        maxWidth: '24rem',
        maxHeight: '20rem',
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400"
      />

      {/* Title Section */}
      <div className="px-2 py-3 bg-gray-50 border-b border-gray-200 rounded-t-md">
        {isEditingLabel ? (
          <input
            ref={inputRef}
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onKeyDown={handleLabelKeyDown}
            onBlur={handleLabelBlur}
            className="w-full text-center font-semibold text-gray-800 bg-transparent border-none outline-none"
            style={{ fontSize: 'inherit' }}
          />
        ) : (
          <div 
            className="font-semibold text-gray-800 text-center cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
            onDoubleClick={handleLabelDoubleClick}
            title="Double-click to edit"
          >
            {node.label}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="px-4 py-3 bg-white rounded-b-md min-h-[2rem] flex flex-col flex-1">
        {isEditingInfo ? (
          <textarea
            ref={textareaRef}
            value={editMarkup}
            onChange={(e) => setEditMarkup(e.target.value)}
            onKeyDown={handleInfoKeyDown}
            onBlur={handleInfoBlur}
            className="w-full h-full text-sm text-gray-600 bg-transparent border-none outline-none resize-none min-h-[1.5rem] px-1 py-0.5 flex-1"
            placeholder="Add description (markdown supported)..."
            style={{ fontSize: 'inherit' }}
          />
        ) : (
          <div 
            className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors min-h-[1.5rem] flex-1 flex items-start overflow-hidden"
            onDoubleClick={handleInfoDoubleClick}
            title="Double-click to edit info"
          >
            {(editMarkup || node.markup) ? (
              <div className="prose prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_strong]:font-bold text-gray-700">
                <ReactMarkdown>
                  {editMarkup || node.markup || ''}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic text-center">
                Double-click to add description
              </div>
            )}
          </div>
        )}
      </div>

      {/* React Flow Node Resizer */}
      <NodeResizer
        {...resizerProps}
        onResizeStart={() => {
          // Disable CSS transitions during resize for instant response
          if (nodeRef.current) {
            nodeRef.current.classList.add('resizing');
          }
        }}
        onResize={(_, data) => {
          // Direct DOM updates - no React re-renders during resize
          if (nodeRef.current) {
            nodeRef.current.style.width = `${data.width}px`;
            nodeRef.current.style.height = `${data.height}px`;
          }
        }}
        onResizeEnd={(_, data) => {
          console.log('onResizeEnd - finalizing resize:', data.width, 'x', data.height);

          // Re-enable CSS transitions
          if (nodeRef.current) {
            nodeRef.current.classList.remove('resizing');
          }

          // Update React state only at the end
          const finalSize = { width: data.width, height: data.height };
          setLocalSize(finalSize);

          console.log('Size-only update:', finalSize);

          // Commit size update to external graph (will trigger single parent update)
          if (onNodeUpdate) {
            const updatedNode = {
              ...node,
              size: finalSize
            };
            console.log('Final size update:', updatedNode.size);
            onNodeUpdate(updatedNode);
          }
        }}
      />

      {/* Edit indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✎</span>
        </div>
      )}
    </div>
  );
};