import React, { useState, useCallback, useEffect } from 'react';

interface ConnectionHandleProps {
  nodeId: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  nodeWidth: number;
  nodeHeight: number;
  onStartConnection: (sourceNodeId: string, handlePosition: 'top' | 'right' | 'bottom' | 'left') => void;
}

export const ConnectionHandle: React.FC<ConnectionHandleProps> = ({
  nodeId,
  position,
  nodeWidth,
  nodeHeight,
  onStartConnection,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate handle position based on node dimensions
  const getHandleStyle = () => {
    const handleSize = 16;
    const offset = 8; // Distance outside the node border
    const baseStyle = {
      position: 'absolute' as const,
      width: `${handleSize}px`,
      height: `${handleSize}px`,
      borderRadius: '50%',
      backgroundColor: '#3b82f6',
      border: '2px solid white',
      cursor: 'pointer',
      zIndex: 20, // Higher z-index to appear above other elements
      transition: 'all 0.2s ease',
      opacity: isDragging ? 0.8 : 1,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          top: `-${offset + handleSize/2}px`,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'right':
        return {
          ...baseStyle,
          top: '50%',
          right: `-${offset + handleSize/2}px`,
          transform: 'translateY(-50%)',
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: `-${offset + handleSize/2}px`,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...baseStyle,
          top: '50%',
          left: `-${offset + handleSize/2}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return baseStyle;
    }
  };

  const getArrowStyle = () => {
    if (!isHovered) return { display: 'none' };

    const arrowSize = 6;
    const handleRadius = 8; // Half of handle size (16px)
    const arrowOffset = handleRadius; // Position arrow exactly at the edge of the circle
    
    const baseArrowStyle = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
      zIndex: 21,
    };

    switch (position) {
      case 'top':
        return {
          ...baseArrowStyle,
          top: `-${arrowOffset}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize * 1.5}px solid #1d4ed8`,
        };
      case 'right':
        return {
          ...baseArrowStyle,
          top: '50%',
          right: `-${arrowOffset}px`,
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize * 1.5}px solid #1d4ed8`,
        };
      case 'bottom':
        return {
          ...baseArrowStyle,
          bottom: `-${arrowOffset}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize * 1.5}px solid #1d4ed8`,
        };
      case 'left':
        return {
          ...baseArrowStyle,
          top: '50%',
          left: `-${arrowOffset}px`,
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize * 1.5}px solid #1d4ed8`,
        };
      default:
        return baseArrowStyle;
    }
  };

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Also stop immediate propagation to prevent any other handlers
    event.nativeEvent.stopImmediatePropagation();
    console.log('Connection handle clicked:', { nodeId, position });
    setIsDragging(true);
    onStartConnection(nodeId, position);
  }, [nodeId, position, onStartConnection]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset dragging state when mouse is released anywhere
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div
      style={getHandleStyle()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="connection-handle nodrag"
    >
      {/* Arrow indicator on hover */}
      <div style={getArrowStyle()} className="nodrag" />
    </div>
  );
};