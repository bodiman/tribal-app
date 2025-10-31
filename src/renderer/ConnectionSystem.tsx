import React, { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';

interface ConnectionSystemProps {
  isActive: boolean;
  sourceNodeId: string | null;
  sourceHandlePosition: 'top' | 'right' | 'bottom' | 'left' | null;
  nodes: any[]; // ReactFlow nodes
  onCompleteConnection: (targetNodeId: string, targetPosition: { x: number; y: number }) => void;
  onCancel: () => void;
}

// Helper function to get the closest edge point on a rectangle
const getClosestPointOnNode = (
  nodePosition: { x: number; y: number },
  nodeSize: { width: number; height: number },
  targetPoint: { x: number; y: number }
): { x: number; y: number } => {
  const nodeLeft = nodePosition.x;
  const nodeRight = nodePosition.x + nodeSize.width;
  const nodeTop = nodePosition.y;
  const nodeBottom = nodePosition.y + nodeSize.height;

  // Calculate which edge is closest

  // Determine which edge of the rectangle is closest
  const distanceToLeft = Math.abs(targetPoint.x - nodeLeft);
  const distanceToRight = Math.abs(targetPoint.x - nodeRight);
  const distanceToTop = Math.abs(targetPoint.y - nodeTop);
  const distanceToBottom = Math.abs(targetPoint.y - nodeBottom);

  const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);

  if (minDistance === distanceToLeft) {
    // Snap to left edge
    return {
      x: nodeLeft,
      y: Math.max(nodeTop, Math.min(nodeBottom, targetPoint.y)),
    };
  } else if (minDistance === distanceToRight) {
    // Snap to right edge
    return {
      x: nodeRight,
      y: Math.max(nodeTop, Math.min(nodeBottom, targetPoint.y)),
    };
  } else if (minDistance === distanceToTop) {
    // Snap to top edge
    return {
      x: Math.max(nodeLeft, Math.min(nodeRight, targetPoint.x)),
      y: nodeTop,
    };
  } else {
    // Snap to bottom edge
    return {
      x: Math.max(nodeLeft, Math.min(nodeRight, targetPoint.x)),
      y: nodeBottom,
    };
  }
};

// Helper function to get handle position coordinates
// This EXACTLY matches the positioning logic in ConnectionHandle.tsx
const getHandlePosition = (
  nodePosition: { x: number; y: number },
  nodeSize: { width: number; height: number },
  handlePosition: 'top' | 'right' | 'bottom' | 'left'
): { x: number; y: number } => {
  // EXACT match with ConnectionHandle.tsx getHandleStyle():
  // - handleSize = 16px (width/height of blue circle)
  // - offset = 8px (distance outside node border)
  // - CSS positioning: top: `-${offset + handleSize/2}px` = -16px
  // - This translates to: nodePosition.y - (offset + handleSize/2) = nodePosition.y - 16
  const handleSize = 16;
  const offset = 8; // Distance outside the node border
  const totalOffset = offset + handleSize / 2; // 16px total (matches CSS calculation)

  // Use React Flow coordinates directly (nodePosition = top-left of node)
  switch (handlePosition) {
    case 'top':
      return {
        x: nodePosition.x + nodeSize.width / 2, // Center horizontally
        y: nodePosition.y - totalOffset, // Above node
      };
    case 'right':
      return {
        x: nodePosition.x + nodeSize.width + totalOffset, // Right of node
        y: nodePosition.y + nodeSize.height / 2, // Center vertically
      };
    case 'bottom':
      return {
        x: nodePosition.x + nodeSize.width / 2, // Center horizontally
        y: nodePosition.y + nodeSize.height + totalOffset, // Below node
      };
    case 'left':
      return {
        x: nodePosition.x - totalOffset, // Left of node
        y: nodePosition.y + nodeSize.height / 2, // Center vertically
      };
  }
};

export const ConnectionSystem: React.FC<ConnectionSystemProps> = ({
  isActive,
  sourceNodeId,
  sourceHandlePosition,
  nodes,
  onCompleteConnection,
  onCancel,
}) => {
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [snapPosition, setSnapPosition] = useState<{ x: number; y: number } | null>(null);

  // Handle mouse movement for preview
  useEffect(() => {
    if (!isActive) {
      setCursorPosition(null);
      setHoveredNodeId(null);
      setSnapPosition(null);
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setCursorPosition(flowPosition);

      // Check if we're hovering over a node
      let foundHoveredNode: string | null = null;
      let foundSnapPosition: { x: number; y: number } | null = null;

      for (const node of nodes) {
        if (node.id === sourceNodeId) continue; // Skip source node

        const nodeSize = {
          width: node.data?.node?.size?.width || node.width || 192,
          height: node.data?.node?.size?.height || node.height || 96,
        };

        const nodeLeft = node.position.x;
        const nodeRight = node.position.x + nodeSize.width;
        const nodeTop = node.position.y;
        const nodeBottom = node.position.y + nodeSize.height;

        // Add some padding for easier targeting
        const padding = 20;
        if (
          flowPosition.x >= nodeLeft - padding &&
          flowPosition.x <= nodeRight + padding &&
          flowPosition.y >= nodeTop - padding &&
          flowPosition.y <= nodeBottom + padding
        ) {
          foundHoveredNode = node.id;
          foundSnapPosition = getClosestPointOnNode(
            node.position,
            nodeSize,
            flowPosition
          );
          break;
        }
      }

      setHoveredNodeId(foundHoveredNode);
      setSnapPosition(foundSnapPosition);
    };

    const handleMouseUp = (event: MouseEvent) => {
      console.log('MouseUp detected:', { hoveredNodeId, snapPosition, hasTarget: !!hoveredNodeId });
      if (hoveredNodeId && snapPosition) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Completing connection on mouseup:', { hoveredNodeId, snapPosition });
        onCompleteConnection(hoveredNodeId, snapPosition);
      } else {
        console.log('MouseUp - no valid target or snap position');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, sourceNodeId, nodes, hoveredNodeId, snapPosition, screenToFlowPosition, onCompleteConnection, onCancel]);

  if (!isActive || !sourceNodeId || !sourceHandlePosition || !cursorPosition) {
    return null;
  }

  const sourceNode = nodes.find(n => n.id === sourceNodeId);
  if (!sourceNode) return null;

  const sourceNodeSize = {
    width: sourceNode.data?.node?.size?.width || sourceNode.width || 192,
    height: sourceNode.data?.node?.size?.height || sourceNode.height || 96,
  };

  const sourcePosition = getHandlePosition(
    sourceNode.position,
    sourceNodeSize,
    sourceHandlePosition
  );

  const targetPosition = snapPosition || cursorPosition;
  const isSnapped = Boolean(snapPosition);

  // Convert to screen coordinates for rendering
  const sourceScreenPos = flowToScreenPosition(sourcePosition);
  const targetScreenPos = flowToScreenPosition(targetPosition);

  const color = isSnapped ? '#10b981' : '#3b82f6';
  const strokeDasharray = isSnapped ? '0' : '5,5';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <svg
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          <marker
            id="connection-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="8.5"
            refY="3"
            orient="auto"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill={color}
            />
          </marker>
        </defs>
        <line
          x1={sourceScreenPos.x}
          y1={sourceScreenPos.y}
          x2={targetScreenPos.x}
          y2={targetScreenPos.y}
          stroke={color}
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          opacity="0.8"
          markerEnd="url(#connection-arrow)"
        />
        {/* Show snap point indicator */}
        {isSnapped && (
          <circle
            cx={targetScreenPos.x}
            cy={targetScreenPos.y}
            r="6"
            fill={color}
            opacity="0.6"
          />
        )}
      </svg>
      
      {/* Status indicator */}
      <div className="absolute top-4 left-4 z-20 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-600">→</span>
          <p className="text-sm text-blue-800 font-medium">
            Creating Connection
          </p>
        </div>
        <p className="text-xs text-blue-600">
          {isSnapped ? 'Click to connect here' : 'Hover over a node to snap'}
        </p>
        <p className="text-xs text-blue-500 mt-1">
          Press Escape to cancel
        </p>
      </div>
    </div>
  );
};