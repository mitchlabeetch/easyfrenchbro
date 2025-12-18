import React from 'react';
import Xarrow from 'react-xarrows';
import { useStore } from '../store';

export const ArrowLayer: React.FC = () => {
  const { arrows, selectedElementId, setSelectedElement, selectionMode } = useStore();

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {arrows.map((arrow) => {
        const isSelected = selectedElementId === arrow.id;

        return (
          <Xarrow
            key={arrow.id}
            start={arrow.startElementId}
            end={arrow.endElementId}
            color={isSelected ? '#3b82f6' : arrow.color}
            strokeWidth={isSelected ? 3 : 2}
            curveness={arrow.curvature}
            headSize={4}
            startAnchor={arrow.startAnchor || "auto"}
            endAnchor={arrow.endAnchor || "auto"}
            labels={arrow.label ? { middle: <div className="bg-white px-1 text-xs border rounded">{arrow.label}</div> } : undefined}
            passProps={{
              cursor: "pointer",
              pointerEvents: "visibleStroke",
              onClick: (e: any) => {
                  if (selectionMode === 'none') {
                      e.stopPropagation();
                      setSelectedElement(arrow.id, 'arrow');
                  }
              }
            }}
          />
        );
      })}
    </div>
  );
};
