import React, { useState } from 'react';
import { useReactFlow } from 'reactflow';
import type { Edge } from '../core/schema';

interface EdgeConnectionEditorProps {
  edge: Edge;
  isVisible: boolean;
  sourceNode: any; // ReactFlow node
  targetNode: any; // ReactFlow node
  onUpdateConnectionPoints: (
    sourceHandle: string,
    targetPosition: { x: number; y: number }
  ) => void;
  onClose: () => void;
}

export const EdgeConnectionEditor: React.FC<EdgeConnectionEditorProps> = ({
  edge,
  isVisible,
  sourceNode,
  targetNode,
  onUpdateConnectionPoints,
  onClose,
}) => {
  const { flowToScreenPosition } = useReactFlow();
  const [selectedHandle, setSelectedHandle] = useState<string>(
    edge.metadata?.sourceHandle || 'right'
  );

  if (!isVisible || !sourceNode || !targetNode) {
    return null;
  }

  const sourceNodeSize = {
    width: sourceNode.data?.node?.size?.width || sourceNode.width || 192,
    height: sourceNode.data?.node?.size?.height || sourceNode.height || 96,
  };

  const targetNodeSize = {
    width: targetNode.data?.node?.size?.width || targetNode.width || 192,
    height: targetNode.data?.node?.size?.height || targetNode.height || 96,
  };

  // Get current target position or default to center-right
  const currentTargetPosition = edge.metadata?.targetPosition || {
    x: targetNode.position.x + targetNodeSize.width,
    y: targetNode.position.y + targetNodeSize.height / 2,
  };

  const handleSourceHandleChange = (newHandle: string) => {
    setSelectedHandle(newHandle);
    onUpdateConnectionPoints(newHandle, currentTargetPosition);
  };

  const handleTargetPositionSelect = (event: React.MouseEvent, side: string) => {
    event.stopPropagation();
    
    let newTargetPosition: { x: number; y: number };
    
    switch (side) {
      case 'top':
        newTargetPosition = {
          x: targetNode.position.x + targetNodeSize.width / 2,
          y: targetNode.position.y,
        };
        break;
      case 'right':
        newTargetPosition = {
          x: targetNode.position.x + targetNodeSize.width,
          y: targetNode.position.y + targetNodeSize.height / 2,
        };
        break;
      case 'bottom':
        newTargetPosition = {
          x: targetNode.position.x + targetNodeSize.width / 2,
          y: targetNode.position.y + targetNodeSize.height,
        };
        break;
      case 'left':
        newTargetPosition = {
          x: targetNode.position.x,
          y: targetNode.position.y + targetNodeSize.height / 2,
        };
        break;
      default:
        return;
    }
    
    onUpdateConnectionPoints(selectedHandle, newTargetPosition);
  };

  // Convert flow positions to screen positions for rendering
  const sourceScreenPos = flowToScreenPosition(sourceNode.position);
  const targetScreenPos = flowToScreenPosition(targetNode.position);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Source node handle selector */}
      <div
        style={{
          position: 'absolute',
          left: sourceScreenPos.x + sourceNodeSize.width + 10,
          top: sourceScreenPos.y,
          pointerEvents: 'all',
        }}
        className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-20"
      >
        <div className="text-sm font-medium text-gray-700 mb-2">Source Handle</div>
        <div className="grid grid-cols-2 gap-1">
          {['top', 'right', 'bottom', 'left'].map((handle) => (
            <button
              key={handle}
              onClick={() => handleSourceHandleChange(handle)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedHandle === handle
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {handle}
            </button>
          ))}
        </div>
      </div>

      {/* Target node connection points */}
      <div
        style={{
          position: 'absolute',
          left: targetScreenPos.x - targetNodeSize.width / 2,
          top: targetScreenPos.y - targetNodeSize.height / 2,
          width: targetNodeSize.width,
          height: targetNodeSize.height,
          pointerEvents: 'all',
        }}
      >
        {/* Top handle */}
        <button
          onClick={(e) => handleTargetPositionSelect(e, 'top')}
          className="absolute w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full border-2 border-white shadow-md transition-colors"
          style={{
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          title="Connect to top"
        />
        
        {/* Right handle */}
        <button
          onClick={(e) => handleTargetPositionSelect(e, 'right')}
          className="absolute w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full border-2 border-white shadow-md transition-colors"
          style={{
            top: '50%',
            right: '-12px',
            transform: 'translateY(-50%)',
          }}
          title="Connect to right"
        />
        
        {/* Bottom handle */}
        <button
          onClick={(e) => handleTargetPositionSelect(e, 'bottom')}
          className="absolute w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full border-2 border-white shadow-md transition-colors"
          style={{
            bottom: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          title="Connect to bottom"
        />
        
        {/* Left handle */}
        <button
          onClick={(e) => handleTargetPositionSelect(e, 'left')}
          className="absolute w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full border-2 border-white shadow-md transition-colors"
          style={{
            top: '50%',
            left: '-12px',
            transform: 'translateY(-50%)',
          }}
          title="Connect to left"
        />

        {/* Target node overlay */}
        <div className="absolute inset-0 border-2 border-green-400 rounded-lg pointer-events-none" />
      </div>

      {/* Close button */}
      <div
        style={{
          position: 'absolute',
          right: '20px',
          top: '20px',
          pointerEvents: 'all',
        }}
      >
        <button
          onClick={onClose}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          Done Editing
        </button>
      </div>

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          left: '20px',
          top: '20px',
          pointerEvents: 'all',
        }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-md max-w-xs"
      >
        <div className="text-sm font-medium text-blue-800 mb-1">
          Editing Connection Points
        </div>
        <div className="text-xs text-blue-600">
          • Select source handle on the left
          <br />
          • Click green circles to set target position
          <br />
          • Click "Done Editing" when finished
        </div>
      </div>
    </div>
  );
};