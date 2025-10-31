import React, { useState, useRef, useEffect } from 'react';
import { type EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
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
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(edge.markup || '');
  const [localSize, setLocalSize] = useState(edge.size ?? { width: 200, height: 80 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditingDescription && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditingDescription]);

  // Reset edit values when edge changes (but not while actively editing)
  useEffect(() => {
    if (!isEditingDescription) {
      setEditDescription(edge.markup || '');
    }
  }, [edge.markup, isEditingDescription]);

  // Sync local size with edge size
  useEffect(() => {
    if (edge.size) {
      setLocalSize(edge.size);
    }
  }, [edge.size]);


  const handleDescriptionDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = () => {
    if (onEdgeUpdate && editDescription !== edge.markup) {
      const trimmedDescription = editDescription.trim() || undefined;
      onEdgeUpdate({
        ...edge,
        markup: trimmedDescription,
      });
      setEditDescription(trimmedDescription || '');
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setEditDescription(edge.markup || '');
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleDescriptionCancel();
    }
  };

  const handleDescriptionBlur = () => {
    handleDescriptionSave();
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
            border-2 shadow-md relative rounded-lg overflow-hidden flex flex-col
            ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
            ${isEditingDescription ? 'border-blue-400 shadow-lg' : ''}
            hover:shadow-lg transition-all duration-200
          `}
        >
          {/* Description Section */}
          <div className="px-3 py-3 bg-white rounded-md min-h-[2rem] flex flex-col flex-1 overflow-hidden h-0">
            {isEditingDescription ? (
              <textarea
                ref={textareaRef}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                onBlur={handleDescriptionBlur}
                className="w-full h-full text-sm text-gray-600 bg-transparent border-none outline-none resize-none min-h-[1.5rem] px-1 py-0.5 flex-1"
                placeholder="Add description (markdown supported)..."
                style={{ fontSize: 'inherit' }}
              />
            ) : (
              <div 
                className="cursor-pointer hover:bg-gray-50 rounded px-1 py-1 transition-colors min-h-[1.5rem] flex-1 flex items-start overflow-hidden max-h-full"
                onDoubleClick={handleDescriptionDoubleClick}
                title="Double-click to edit description"
              >
                {(editDescription || edge.markup) ? (
                  <div className="prose prose-sm max-w-none text-gray-700 w-full overflow-hidden line-clamp-4">
                    <ReactMarkdown>
                      {editDescription || edge.markup || ''}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic text-center w-full">
                    Double-click to add description
                  </div>
                )}
              </div>
            )}
          </div>


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