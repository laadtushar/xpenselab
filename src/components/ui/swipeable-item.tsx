'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { Trash2, Edit, Copy, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SwipeAction {
  label: string;
  icon?: ReactNode;
  action: () => void;
  className?: string;
  color?: 'default' | 'destructive' | 'secondary';
}

interface SwipeableItemProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right') => void;
  disabled?: boolean;
  className?: string;
}

export function SwipeableItem({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  disabled = false,
  className,
}: SwipeableItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const SWIPE_THRESHOLD = 100;
  const MAX_DRAG = 200;

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const item = itemRef.current;
    if (!item) return;

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      currentX.current = startX.current;
      isDraggingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;

      currentX.current = e.touches[0].clientX;
      const diff = currentX.current - startX.current;

      if (Math.abs(diff) > 10) {
        setIsDragging(true);
        
        // Determine which side has actions
        const hasLeftActions = leftActions.length > 0;
        const hasRightActions = rightActions.length > 0;

        if (diff > 0 && hasLeftActions) {
          // Swiping right (revealing left actions)
          setDragOffset(Math.min(diff, MAX_DRAG));
        } else if (diff < 0 && hasRightActions) {
          // Swiping left (revealing right actions)
          setDragOffset(Math.max(diff, -MAX_DRAG));
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current) return;

      const diff = currentX.current - startX.current;
      const absDiff = Math.abs(diff);

      if (absDiff > SWIPE_THRESHOLD) {
        if (diff > 0 && leftActions.length > 0) {
          setIsOpen(true);
          setDragOffset(MAX_DRAG);
          onSwipe?.('right');
        } else if (diff < 0 && rightActions.length > 0) {
          setIsOpen(true);
          setDragOffset(-MAX_DRAG);
          onSwipe?.('left');
        } else {
          resetPosition();
        }
      } else {
        resetPosition();
      }

      setIsDragging(false);
      isDraggingRef.current = false;
    };

    const resetPosition = () => {
      setDragOffset(0);
      setIsOpen(false);
    };

    item.addEventListener('touchstart', handleTouchStart, { passive: true });
    item.addEventListener('touchmove', handleTouchMove, { passive: true });
    item.addEventListener('touchend', handleTouchEnd);

    return () => {
      item.removeEventListener('touchstart', handleTouchStart);
      item.removeEventListener('touchmove', handleTouchMove);
      item.removeEventListener('touchend', handleTouchEnd);
    };
  }, [leftActions.length, rightActions.length, onSwipe, disabled]);

  const handleActionClick = (action: SwipeAction) => {
    action.action();
    resetPosition();
  };

  const resetPosition = () => {
    setDragOffset(0);
    setIsOpen(false);
  };

  const leftActionsWidth = leftActions.length * 70;
  const rightActionsWidth = rightActions.length * 70;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center bg-primary text-primary-foreground"
          style={{
            width: `${leftActionsWidth}px`,
            transform: `translateX(${Math.max(dragOffset - leftActionsWidth, -leftActionsWidth)}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {leftActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={cn(
                "h-full rounded-none text-primary-foreground hover:bg-primary/80",
                action.className
              )}
              onClick={() => handleActionClick(action)}
            >
              {action.icon || <MoreVertical className="h-5 w-5" />}
            </Button>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 flex items-center",
            rightActions[0]?.color === 'destructive' 
              ? "bg-destructive text-destructive-foreground" 
              : "bg-primary text-primary-foreground"
          )}
          style={{
            width: `${rightActionsWidth}px`,
            transform: `translateX(${Math.min(dragOffset + rightActionsWidth, rightActionsWidth)}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {rightActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={cn(
                "h-full rounded-none hover:opacity-80",
                action.color === 'destructive' 
                  ? "text-destructive-foreground hover:bg-destructive/80"
                  : "text-primary-foreground hover:bg-primary/80",
                action.className
              )}
              onClick={() => handleActionClick(action)}
            >
              {action.icon || <Trash2 className="h-5 w-5" />}
            </Button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div
        ref={itemRef}
        className={cn(
          "relative bg-background transition-transform",
          isDragging && "select-none"
        )}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onClick={() => {
          if (isOpen) {
            resetPosition();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
