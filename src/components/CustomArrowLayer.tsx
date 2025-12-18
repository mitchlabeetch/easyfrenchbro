import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store';

interface ArrowPath {
  id: string;
  d: string;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  strokeWidth: number;
  headStyle: 'arrow' | 'none' | 'dot' | 'diamond';
  isSelected: boolean;
}

/**
 * CustomArrowLayer - Renders curved arrows between word groups
 * 
 * Features:
 * - Arrows curve BELOW the text (not through words)
 * - Connects from underline to underline
 * - Supports one-to-many and many-to-one connections
 * - Custom styling (solid, dashed, dotted)
 * - Selectable arrows for editing
 */
interface CustomArrowLayerProps {
  onArrowClick?: (arrowId: string, position: { x: number; y: number }) => void;
}

export const CustomArrowLayer: React.FC<CustomArrowLayerProps> = ({ onArrowClick }) => {
  const { arrows, wordGroups, selectedElementId, setSelectedElement, selectionMode } = useStore();
  const [arrowPaths, setArrowPaths] = useState<ArrowPath[]>([]);

  // Calculate arrow paths when arrows or word groups change
  const calculatePaths = useCallback(() => {
    const paths: ArrowPath[] = [];

    arrows.forEach(arrow => {
      // Get source and target group elements
      const sourcePositions: DOMRect[] = [];
      const targetPositions: DOMRect[] = [];

      // Gather source group positions
      arrow.sourceGroupIds.forEach(groupId => {
        const group = wordGroups.find(g => g.id === groupId);
        if (!group) return;

        // Get all word elements in this group
        const groupRect = getGroupBoundingRect(group.wordIds);
        if (groupRect) {
          sourcePositions.push(groupRect);
        }
      });

      // Gather target group positions
      arrow.targetGroupIds.forEach(groupId => {
        const group = wordGroups.find(g => g.id === groupId);
        if (!group) return;

        const groupRect = getGroupBoundingRect(group.wordIds);
        if (groupRect) {
          targetPositions.push(groupRect);
        }
      });

      // Create arrow paths from each source to each target
      sourcePositions.forEach(sourceRect => {
        targetPositions.forEach(targetRect => {
          const path = calculateBezierPath(sourceRect, targetRect, arrow.curvature);
          paths.push({
            id: arrow.id,
            d: path,
            color: arrow.color,
            style: arrow.style,
            strokeWidth: arrow.strokeWidth,
            headStyle: arrow.headStyle,
            isSelected: selectedElementId === arrow.id
          });
        });
      });
    });

    setArrowPaths(paths);
  }, [arrows, wordGroups, selectedElementId]);

  // Recalculate on mount and when dependencies change
  useEffect(() => {
    calculatePaths();
    
    // Also recalculate on scroll/resize
    const handleUpdate = () => {
      requestAnimationFrame(calculatePaths);
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    
    // Use MutationObserver for DOM changes
    const mutationObserver = new MutationObserver(handleUpdate);
    const workspace = document.getElementById('workspace-container');
    if (workspace) {
      mutationObserver.observe(workspace, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    }

    // Use ResizeObserver to catch layout changes that don't trigger mutations
    let resizeObserver: ResizeObserver | null = null;
    if (workspace && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleUpdate);
      resizeObserver.observe(workspace);
      // Also observe all word group elements for size changes
      const groupElements = workspace.querySelectorAll('[data-group-id]');
      groupElements.forEach(el => resizeObserver?.observe(el));
    }

    // Periodic refresh for CSS transitions/animations that don't trigger observers
    const intervalId = setInterval(handleUpdate, 500);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      clearInterval(intervalId);
    };
  }, [calculatePaths]);

  const handleArrowClick = (arrowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Calculate click position relative to viewport for the menu
    const position = { x: e.clientX, y: e.clientY };

    if (selectionMode === 'none') {
      setSelectedElement(arrowId, 'arrow');
      onArrowClick?.(arrowId, position);
    }
  };

  // Get stroke-dasharray for different styles
  const getDashArray = (style: string) => {
    switch (style) {
      case 'dashed': return '8,4';
      case 'dotted': return '2,4';
      default: return 'none';
    }
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      style={{ zIndex: 10 }}
    >
      <defs>
        {/* Arrow markers for different colors */}
        {arrowPaths.map(path => (
          <marker
            key={`marker-${path.id}`}
            id={`arrowhead-${path.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            {path.headStyle === 'arrow' && (
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={path.isSelected ? '#3b82f6' : path.color}
              />
            )}
            {path.headStyle === 'dot' && (
              <circle cx="5" cy="3.5" r="3" fill={path.isSelected ? '#3b82f6' : path.color} />
            )}
            {path.headStyle === 'diamond' && (
              <polygon
                points="0 3.5, 5 0, 10 3.5, 5 7"
                fill={path.isSelected ? '#3b82f6' : path.color}
              />
            )}
          </marker>
        ))}
      </defs>

      {arrowPaths.map((path, idx) => (
        <g key={`arrow-${path.id}-${idx}`}>
          {/* Invisible wider path for easier clicking */}
          <path
            d={path.d}
            stroke="transparent"
            strokeWidth={path.strokeWidth + 10}
            fill="none"
            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            onClick={(e) => handleArrowClick(path.id, e)}
          />
          {/* Visible arrow path */}
          <path
            d={path.d}
            stroke={path.isSelected ? '#3b82f6' : path.color}
            strokeWidth={path.isSelected ? path.strokeWidth + 1 : path.strokeWidth}
            strokeDasharray={getDashArray(path.style)}
            fill="none"
            markerEnd={path.headStyle !== 'none' ? `url(#arrowhead-${path.id})` : undefined}
            style={{ pointerEvents: 'none' }}
          />
        </g>
      ))}
    </svg>
  );
};

/**
 * Get the combined bounding rect for a group of word elements
 */
function getGroupBoundingRect(wordIds: string[]): DOMRect | null {
  const container = document.getElementById('workspace-container');
  if (!container) return null;
  
  const containerRect = container.getBoundingClientRect();
  const scrollLeft = container.scrollLeft;
  const scrollTop = container.scrollTop;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  wordIds.forEach(wordId => {
    const el = document.getElementById(wordId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = rect.left - containerRect.left + scrollLeft;
    const y = rect.top - containerRect.top + scrollTop;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + rect.width);
    maxY = Math.max(maxY, y + rect.height);
  });

  if (minX === Infinity) return null;

  return new DOMRect(minX, minY, maxX - minX, maxY - minY);
}

/**
 * Calculate a bezier path that curves BELOW the text
 * 
 * The arrow starts from the bottom-center of the source,
 * curves downward (below the text line), and ends at the
 * bottom-center of the target.
 */
function calculateBezierPath(
  source: DOMRect,
  target: DOMRect,
  curvature: number
): string {
  // Start point: bottom center of source
  const startX = source.left + source.width / 2;
  const startY = source.top + source.height + 5; // 5px below the underline

  // End point: bottom center of target
  const endX = target.left + target.width / 2;
  const endY = target.top + target.height + 5;

  // Calculate control points for a curve that goes BELOW
  const distanceX = Math.abs(endX - startX);
  const distanceY = Math.abs(endY - startY);
  const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
  
  // The curve depth increases with distance and curvature setting
  const curveDepth = Math.max(30, distance * 0.3) * curvature;
  
  // Control points go below the line
  const midX = (startX + endX) / 2;
  const midY = Math.max(startY, endY) + curveDepth;

  // For same-line arrows, use quadratic bezier
  if (Math.abs(startY - endY) < 10) {
    return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  }

  // For different lines, use cubic bezier for smoother curves
  const cp1Y = startY + curveDepth * 0.5;
  const cp2Y = endY + curveDepth * 0.5;

  return `M ${startX} ${startY} C ${startX} ${cp1Y}, ${endX} ${cp2Y}, ${endX} ${endY}`;
}

export default CustomArrowLayer;
