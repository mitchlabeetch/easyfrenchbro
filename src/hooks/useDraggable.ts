import { useState, useCallback, useRef, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  initialPosition?: Position;
  bounds?: 'parent' | 'window' | null;
}

interface UseDraggableReturn {
  position: Position;
  setPosition: (pos: Position) => void;
  handleMouseDown: (e: React.MouseEvent<HTMLElement>) => void;
  isDragging: boolean;
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => void;
    style: React.CSSProperties;
  };
}

/**
 * Hook for making elements draggable
 * Use `dragHandleProps` on the drag handle element (e.g., header bar)
 * Apply `position` to the container's style as { left: position.x, top: position.y }
 */
export function useDraggable(options: UseDraggableOptions = {}): UseDraggableReturn {
  const { initialPosition = { x: 0, y: 0 }, bounds = 'window' } = options;
  
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const elementStartPos = useRef<Position>({ x: 0, y: 0 });

  // Update position when initialPosition changes
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    // Only respond to left click
    if (e.button !== 0) return;
    
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
      
      // Apply bounds if specified
      if (bounds === 'window') {
        newX = Math.max(0, Math.min(window.innerWidth - 100, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 50, newY));
      }
      
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
  }, [isDragging, bounds]);

  return {
    position,
    setPosition,
    handleMouseDown,
    isDragging,
    dragHandleProps: {
      onMouseDown: handleMouseDown,
      style: { cursor: isDragging ? 'grabbing' : 'grab' },
    },
  };
}
