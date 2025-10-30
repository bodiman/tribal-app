import React, { useState, useRef, useEffect } from 'react';
import { type EdgeProps, getBezierPath, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import ReactMarkdown from 'react-markdown';
import type { Edge } from '../core/schema';

interface EdgeData {
  edge: Edge;
  onEdgeUpdate?: (updatedEdge: Edge) => void;
}

export const EdgeView: React.FC<EdgeProps<EdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}) => {
  const { edge, onEdgeUpdate } = data || { edge: { id, source: '', target: '', directed: true } };
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editLabel, setEditLabel] = useState(edge.label || '');
  const [editMarkup, setEditMarkup] = useState(edge.markup || '');
  const [localSize, setLocalSize] = useState(edge.size ?? { width: 128, height: 64 });
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [_isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ 
    width: number; 
    height: number; 
    startX: number; 
    startY: number;
    resizeRight: boolean;
    resizeLeft: boolean;
    resizeBottom: boolean;
    resizeTop: boolean;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Get ReactFlow instance for zoom-adjusted sensitivity
  const { getZoom } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

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

  // Reset edit values when edge changes (but not while actively editing)
  useEffect(() => {
    if (!isEditingLabel) {
      setEditLabel(edge.label || '');
    }
    if (!isEditingInfo) {
      setEditMarkup(edge.markup || '');
    }
  }, [edge.label, edge.markup, isEditingLabel, isEditingInfo]);

  // Sync local size with edge size
  useEffect(() => {
    if (edge.size) {
      setLocalSize(edge.size);
    }
  }, [edge.size]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingLabel(true);
  };

  const handleInfoDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingInfo(true);
  };

  const handleLabelSave = () => {
    if (onEdgeUpdate && editLabel.trim() && editLabel !== edge.label) {
      onEdgeUpdate({
        ...edge,
        label: editLabel.trim(),
      });
    }
    setIsEditingLabel(false);
  };

  const handleInfoSave = () => {
    if (onEdgeUpdate && editMarkup !== edge.markup) {
      const trimmedMarkup = editMarkup.trim() || undefined;
      onEdgeUpdate({
        ...edge,
        markup: trimmedMarkup,
      });
      setEditMarkup(trimmedMarkup || '');
    }
    setIsEditingInfo(false);
  };

  const handleLabelCancel = () => {
    setEditLabel(edge.label || '');
    setIsEditingLabel(false);
  };

  const handleInfoCancel = () => {
    setEditMarkup(edge.markup || '');
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

  // Optimized custom resize handlers
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    
    // Disable CSS transitions for instant response (like regular nodes)
    if (nodeRef.current) {
      nodeRef.current.classList.add('resizing');
    }
    
    // Pre-parse direction for performance
    resizeStartRef.current = {
      width: localSize.width,
      height: localSize.height,
      startX: e.clientX,
      startY: e.clientY,
      resizeRight: direction.includes('right'),
      resizeLeft: direction.includes('left'),
      resizeBottom: direction.includes('bottom'),
      resizeTop: direction.includes('top'),
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current || !nodeRef.current) return;

      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!resizeStartRef.current || !nodeRef.current) return;

        const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
        const deltaY = moveEvent.clientY - resizeStartRef.current.startY;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;

        // Calculate zoom-adjusted sensitivity (inverse relationship)
        const zoom = getZoom();
        const sensitivity = 2 / zoom;

        // Apply resize with double sensitivity to compensate for center positioning
        if (resizeStartRef.current.resizeRight) {
          newWidth = Math.max(128, resizeStartRef.current.width + deltaX * sensitivity);
        }
        if (resizeStartRef.current.resizeLeft) {
          newWidth = Math.max(128, resizeStartRef.current.width - deltaX * sensitivity);
        }
        if (resizeStartRef.current.resizeBottom) {
          newHeight = Math.max(64, resizeStartRef.current.height + deltaY * sensitivity);
        }
        if (resizeStartRef.current.resizeTop) {
          newHeight = Math.max(64, resizeStartRef.current.height - deltaY * sensitivity);
        }

        // Direct DOM update for instant response
        nodeRef.current.style.width = `${newWidth}px`;
        nodeRef.current.style.height = `${newHeight}px`;
      });
    };

    const handleMouseUp = () => {
      if (!resizeStartRef.current) return;

      setIsResizing(false);
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Re-enable CSS transitions (like regular nodes)
      if (nodeRef.current) {
        nodeRef.current.classList.remove('resizing');
      }
      
      // Get final size from DOM
      const finalWidth = parseFloat(nodeRef.current?.style.width || '128');
      const finalHeight = parseFloat(nodeRef.current?.style.height || '64');
      const finalSize = { width: finalWidth, height: finalHeight };
      
      setLocalSize(finalSize);

      if (onEdgeUpdate) {
        onEdgeUpdate({
          ...edge,
          size: finalSize
        });
      }

      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Custom resize handle style
  const resizeHandleStyle = {
    position: 'absolute' as const,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    zIndex: 10,
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className={`react-flow__edge-path ${
          selected ? 'stroke-blue-500 stroke-2' : 'stroke-gray-400'
        }`}
        d={edgePath}
      />
      
      <EdgeLabelRenderer>
        <div
          ref={nodeRef}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 1,
            width: localSize.width,
            height: localSize.height,
            minWidth: '8rem',
            minHeight: '4rem',
          }}
          className={`
            border-2 shadow-md relative rounded-lg overflow-visible flex flex-col
            ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
            ${isEditingLabel || isEditingInfo ? 'border-blue-400 shadow-lg' : ''}
            hover:shadow-lg transition-all duration-200
          `}
        >
          {/* Title Section */}
          <div className="px-2 py-2 bg-gray-50 border-b border-gray-200 rounded-t-md">
            {isEditingLabel ? (
              <input
                ref={inputRef}
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={handleLabelKeyDown}
                onBlur={handleLabelBlur}
                className="w-full text-center font-medium text-gray-800 bg-transparent border-none outline-none text-xs"
                style={{ fontSize: 'inherit' }}
              />
            ) : (
              <div 
                className="font-medium text-gray-800 text-center cursor-pointer hover:bg-gray-100 rounded px-1 py-1 transition-colors text-xs"
                onDoubleClick={handleLabelDoubleClick}
                title="Double-click to edit"
              >
                {edge.label || 'Relationship'}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="px-3 py-2 bg-white rounded-b-md min-h-[1.5rem] flex flex-col flex-1">
            {isEditingInfo ? (
              <textarea
                ref={textareaRef}
                value={editMarkup}
                onChange={(e) => setEditMarkup(e.target.value)}
                onKeyDown={handleInfoKeyDown}
                onBlur={handleInfoBlur}
                className="w-full h-full text-xs text-gray-600 bg-transparent border-none outline-none resize-none min-h-[1rem] px-1 py-0.5 flex-1"
                placeholder="Add description (markdown supported)..."
                style={{ fontSize: 'inherit' }}
              />
            ) : (
              <div 
                className="cursor-pointer hover:bg-gray-50 rounded px-1 py-1 transition-colors min-h-[1rem] flex-1 flex items-start overflow-hidden"
                onDoubleClick={handleInfoDoubleClick}
                title="Double-click to edit info"
              >
                {(editMarkup || edge.markup) ? (
                  <div className="prose prose-xs max-w-none [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_strong]:font-bold text-gray-700 w-full overflow-hidden">
                    <ReactMarkdown>
                      {editMarkup || edge.markup || ''}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic text-center w-full">
                    Double-click to add description
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom resize handles */}
          {selected && (
            <>
              {/* Corner handles */}
              <div
                style={{
                  ...resizeHandleStyle,
                  top: '-8px',
                  left: '-8px',
                  width: '16px',
                  height: '16px',
                  cursor: 'nw-resize',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'top-left')}
              />
              <div
                style={{
                  ...resizeHandleStyle,
                  top: '-8px',
                  right: '-8px',
                  width: '16px',
                  height: '16px',
                  cursor: 'ne-resize',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'top-right')}
              />
              <div
                style={{
                  ...resizeHandleStyle,
                  bottom: '-8px',
                  left: '-8px',
                  width: '16px',
                  height: '16px',
                  cursor: 'sw-resize',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
              />
              <div
                style={{
                  ...resizeHandleStyle,
                  bottom: '-8px',
                  right: '-8px',
                  width: '16px',
                  height: '16px',
                  cursor: 'se-resize',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
              />
              
              {/* Side handles */}
              <div
                style={{
                  ...resizeHandleStyle,
                  top: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '32px',
                  height: '8px',
                  cursor: 'n-resize',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'top')}
              />
              <div
                style={{
                  ...resizeHandleStyle,
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '32px',
                  height: '8px',
                  cursor: 's-resize',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'bottom')}
              />
              <div
                style={{
                  ...resizeHandleStyle,
                  left: '-4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '8px',
                  height: '32px',
                  cursor: 'w-resize',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'left')}
              />
              <div
                style={{
                  ...resizeHandleStyle,
                  right: '-4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '8px',
                  height: '32px',
                  cursor: 'e-resize',
                }}
                onMouseDown={(e) => handleResizeStart(e, 'right')}
              />
            </>
          )}

          {/* Edit indicator */}
          {selected && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✎</span>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};