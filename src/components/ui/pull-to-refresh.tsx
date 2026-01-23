'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  threshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
  threshold = 80,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canPull = useRef(false);

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh when at the very top of the container
      if (container.scrollTop > 0) {
        canPull.current = false;
        return;
      }
      startY.current = e.touches[0].clientY;
      canPull.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // If we can't pull or user has scrolled, allow normal scrolling
      if (!canPull.current || container.scrollTop > 0) {
        canPull.current = false;
        return;
      }

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      // Only prevent default and show pull indicator if user is pulling DOWN significantly
      // This allows normal scrolling when user scrolls up or makes small movements
      if (distance > 10) {
        e.preventDefault();
        setIsPulling(true);
        setPullDistance(Math.min(distance, threshold * 1.5));
      } else if (distance < -5) {
        // User is scrolling up, cancel pull gesture
        canPull.current = false;
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull.current) return;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setIsPulling(false);
        setPullDistance(0);
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }

      canPull.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, onRefresh, isRefreshing, disabled]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowIndicator = isPulling || isRefreshing;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {shouldShowIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 transition-opacity"
          style={{
            transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
            opacity: pullProgress,
          }}
        >
          <div className="bg-background border rounded-full p-3 shadow-lg">
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Loader2 
                className="h-5 w-5 text-muted-foreground transition-transform"
                style={{ transform: `rotate(${pullProgress * 180}deg)` }}
              />
            )}
          </div>
        </div>
      )}
      <div
        style={{
          transform: shouldShowIndicator ? `translateY(${Math.min(pullDistance, threshold)}px)` : 'translateY(0)',
          transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
