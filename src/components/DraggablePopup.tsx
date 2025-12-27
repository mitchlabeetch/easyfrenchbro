import React, { useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { GripHorizontal } from 'lucide-react';

interface DraggablePopupProps {
  children: ReactNode;
  initialPosition: { x: number; y: number };
  title?: string;
  onClose?: () => void;
  className?: string;
  showDragHandle?: boolean;
}

/**
 * Wrapper component that makes any popup draggable
 * Wrap your popup content with this and it becomes movable
 */
export const DraggablePopup: React.FC<DraggablePopupProps> = ({
  children,
  initialPosition,
  title,
  onClose,
  className = '',
  showDragHandle = true,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  // Update position when initialPosition changes
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { ...position };
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      let newX = elementStartPos.current.x + deltaX;
      let newY = elementStartPos.current.y + deltaY;
      
      // Keep within viewport
      newX = Math.max(0, Math.min(window.innerWidth - 100, newX));
      newY = Math.max(0, Math.min(window.innerHeight - 50, newY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className={`fixed z-[100] bg-white dark:bg-gray-800 shadow-xl border dark:border-gray-700 rounded-lg no-print ${className}`}
      style={{ left: position.x, top: position.y }}
    >
      {/* Drag Handle Header */}
      {showDragHandle && (
        <div
          className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-700 select-none bg-gray-50 dark:bg-gray-900 rounded-t-lg"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
            <GripHorizontal size={12} className="text-gray-400" />
            {title || 'Menu'}
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              ×
            </button>
          )}
        </div>
      )}
      {/* Content */}
      <div className="p-2">
        {children}
      </div>
    </div>
  );
};

export default DraggablePopup;
